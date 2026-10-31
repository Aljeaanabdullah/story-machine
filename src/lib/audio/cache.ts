import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

/** FNV-1a: short, stable cache keys for synthesized audio. */
export function hashKey(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36) + input.length.toString(36);
}

const memory = new Map<string, Promise<string>>();
const MAX_FILES = 400;

function cacheDir(): Directory {
  const dir = new Directory(Paths.cache, 'tts');
  dir.create({ intermediates: true, idempotent: true });
  return dir;
}

/** Keeps the on-disk cache bounded by deleting the oldest files. */
function prune(dir: Directory) {
  const files = dir.list().filter((f): f is File => f instanceof File);
  if (files.length <= MAX_FILES) return;
  files.sort((a, b) => (a.lastModified ?? 0) - (b.lastModified ?? 0));
  for (const f of files.slice(0, files.length - MAX_FILES)) f.delete();
}

/**
 * Returns a playable URI for synthesized audio, fetching it once and reusing it
 * afterwards: a file in the app cache on phones, an object URL on web.
 * Concurrent requests for the same key share one download.
 */
export function cachedAudio(key: string, download: () => Promise<ArrayBuffer>): Promise<string> {
  const hit = memory.get(key);
  if (hit) return hit;
  const job = (async () => {
    if (Platform.OS === 'web') {
      const blob = new Blob([await download()], { type: 'audio/wav' });
      return URL.createObjectURL(blob);
    }
    const dir = cacheDir();
    const file = new File(dir, `${hashKey(key)}.wav`);
    if (file.exists && file.size > 44) return file.uri;
    const bytes = new Uint8Array(await download());
    file.create({ overwrite: true });
    await file.write(bytes);
    prune(dir);
    return file.uri;
  })();
  memory.set(key, job);
  job.catch(() => memory.delete(key));
  return job;
}
