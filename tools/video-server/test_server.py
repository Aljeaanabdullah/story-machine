"""
Queue tests with a fake engine (no GPU, no model needed):
    tools/video-server/.venv/Scripts/python tools/video-server/test_server.py
"""

import sys
import tempfile
import time
import types
import unittest
from pathlib import Path

import torch

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))


class Cancelled(Exception):
    pass


class FakeEngine:
    """Scripted behaviour per preset width: 'ok', 'oom' or 'slow'."""
    plan: dict = {}
    runs: list = []

    def generate(self, job, on_progress=None, cancelled=None):
        FakeEngine.runs.append(job.width)
        mode = FakeEngine.plan.get(job.width, "ok")
        if mode == "oom":
            raise torch.cuda.OutOfMemoryError("CUDA out of memory")
        for i in range(20 if mode == "slow" else 1):
            on_progress("rendering", (i + 1) / 20)
            if cancelled():
                raise Cancelled()
            time.sleep(0.05)
        job.out.write_bytes(b"mp4")
        return types.SimpleNamespace(seconds=1.0, peak_vram_gb=1.0)

    def unload(self):
        pass


sys.modules["engine"] = types.SimpleNamespace(Cancelled=Cancelled, Job=lambda **kw: types.SimpleNamespace(**kw), WanEngine=FakeEngine)
import server  # noqa: E402


def wait(q, job_id, timeout=5):
    end = time.time() + timeout
    while time.time() < end:
        j = q.get(job_id)
        if j["status"] not in ("queued", "rendering"):
            return j
        time.sleep(0.02)
    raise AssertionError("job did not finish")


class QueueTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        server.OUT = Path(self.tmp.name)
        FakeEngine.plan, FakeEngine.runs = {}, []
        self.q = server.Queue()

    def tearDown(self):
        self.tmp.cleanup()

    def test_ready_and_cached(self):
        j = wait(self.q, self.q.submit("world-lost-island", "waves", 7)["id"])
        self.assertEqual(j["status"], "ready")
        self.assertTrue(j["video"].startswith("/videos/"))
        again = self.q.submit("world-lost-island", "waves", 7)
        self.assertEqual((again["status"], again["stage"]), ("ready", "cached"))
        self.assertEqual(len(FakeEngine.runs), 1)

    def test_oom_retries_smaller_then_succeeds(self):
        FakeEngine.plan = {832: "oom"}
        j = wait(self.q, self.q.submit("world-lost-island", "mist", 1)["id"])
        self.assertEqual(j["status"], "ready")
        self.assertEqual(FakeEngine.runs, [832, 640])

    def test_oom_twice_fails_cleanly(self):
        FakeEngine.plan = {832: "oom", 640: "oom"}
        j = wait(self.q, self.q.submit("world-lost-island", "mist", 2)["id"])
        self.assertEqual((j["status"], j["error"]), ("failed", "gpu_out_of_memory"))
        self.assertEqual(list(server.OUT.glob("*.mp4")), [])

    def test_cancel_running(self):
        FakeEngine.plan = {832: "slow"}
        job_id = self.q.submit("world-lost-island", "rain", 3)["id"]
        while self.q.get(job_id)["status"] != "rendering":
            time.sleep(0.01)
        self.q.cancel(job_id)
        self.assertEqual(wait(self.q, job_id)["status"], "cancelled")

    def test_duplicate_requests_share_one_job(self):
        FakeEngine.plan = {832: "slow"}
        a = self.q.submit("world-lost-island", "same", 4)
        b = self.q.submit("world-lost-island", "same", 4)
        self.assertEqual(a["id"], b["id"])

    def test_only_private_network_clients(self):
        for ok in ("127.0.0.1", "192.168.8.20", "10.0.0.5", "172.16.3.4", "::1", "::ffff:192.168.1.9"):
            self.assertTrue(server.allowed(ok), ok)
        for bad in ("8.8.8.8", "203.0.113.9", "100.64.1.1", "2001:4860::8888", "::ffff:8.8.8.8", "nonsense"):
            self.assertFalse(server.allowed(bad), bad)


if __name__ == "__main__":
    unittest.main(verbosity=2)
