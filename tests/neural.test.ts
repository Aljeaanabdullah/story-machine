import { detectEmotion, dialogueSegments, castFor, buildSegments } from '@/lib/audio/dialogue';
import { hashKey } from '@/lib/audio/cache';
import { createNeuralSpeech, withFallback } from '@/lib/audio/providers/neural';
import type { SpeakCallbacks, SpeakOptions, SpeechProvider } from '@/lib/audio/types';
import { speakOptionsFor } from '@/lib/audio/voices';
import { draftFor } from './helpers';

// --- fakes for native modules -------------------------------------------------
type StatusListener = (s: { didJustFinish?: boolean; error?: string | null }) => void;
const players: { uri: string; volume: number; playing: boolean; removed: boolean; emit: StatusListener }[] = [];

jest.mock('expo-audio', () => ({
  createAudioPlayer: (src: { uri: string }) => {
    const listeners: StatusListener[] = [];
    const p = {
      uri: src.uri,
      volume: 1,
      playing: false,
      removed: false,
      emit: (s: Parameters<StatusListener>[0]) => listeners.forEach((l) => l(s)),
      addListener: (_: string, l: StatusListener) => listeners.push(l),
      play() {
        p.playing = true;
      },
      pause() {
        p.playing = false;
      },
      remove() {
        p.removed = true;
      },
    };
    players.push(p);
    return p;
  },
}));

const downloads: string[] = [];
jest.mock('@/lib/audio/cache', () => ({
  ...jest.requireActual('@/lib/audio/cache'),
  cachedAudio: async (key: string, download: () => Promise<ArrayBuffer>) => {
    downloads.push(key);
    await download();
    return `file://cache/${key.length}.wav`;
  },
}));

const flush = () => new Promise((r) => setTimeout(r, 0));
const OPTS: SpeakOptions = speakOptionsFor('villain', [], { language: 'ar', multiVoice: true, rate: 1, volume: 0.5 }, 'whisper');

function okFetch() {
  return jest.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith('/health')) return { ok: true } as Response;
    return { ok: true, arrayBuffer: async () => new ArrayBuffer(8), body: init?.body } as unknown as Response;
  });
}

beforeEach(() => {
  players.length = 0;
  downloads.length = 0;
});

describe('neural (local Piper server) provider', () => {
  it('is unavailable without a server URL and never touches the network', async () => {
    const fetchMock = okFetch();
    global.fetch = fetchMock as unknown as typeof fetch;
    const p = createNeuralSpeech(() => '');
    expect(p.isAvailable()).toBe(false);
    await expect(p.prepare!()).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('checks /health, sends role, emotion and the user speed only, and plays the cached file', async () => {
    const fetchMock = okFetch();
    global.fetch = fetchMock as unknown as typeof fetch;
    const p = createNeuralSpeech(() => 'http://pc:5002');
    await expect(p.prepare!()).resolves.toBe(true);

    const cb: SpeakCallbacks = { onDone: jest.fn(), onError: jest.fn() };
    p.speak('«قف!»', OPTS, cb);
    await flush();
    await flush();
    const body = JSON.parse(String(fetchMock.mock.calls[1][1]?.body));
    expect(fetchMock.mock.calls[1][0]).toBe('http://pc:5002/tts');
    expect(body).toEqual({ text: '«قف!»', language: 'ar', role: 'villain', emotion: 'whisper', rate: 1 });
    expect(players[0]).toMatchObject({ playing: true, volume: 0.5 });

    players[0].emit({ didJustFinish: true });
    expect(cb.onDone).toHaveBeenCalledTimes(1);
    expect(players[0].removed).toBe(true);
  });

  it('reports playback errors and ignores events after stop()', async () => {
    global.fetch = okFetch() as unknown as typeof fetch;
    const p = createNeuralSpeech(() => 'http://pc:5002');
    const cb: SpeakCallbacks = { onDone: jest.fn(), onError: jest.fn() };
    p.speak('One.', OPTS, cb);
    await flush();
    await flush();
    players[0].emit({ error: 'decode failed' });
    expect(cb.onError).toHaveBeenCalledTimes(1);

    const cb2: SpeakCallbacks = { onDone: jest.fn(), onError: jest.fn() };
    p.speak('Two.', OPTS, cb2);
    await flush();
    await flush();
    p.stop();
    players[1].emit({ didJustFinish: true });
    expect(cb2.onDone).not.toHaveBeenCalled();
  });

  it('prefetches the next segment without playing it', async () => {
    global.fetch = okFetch() as unknown as typeof fetch;
    const p = createNeuralSpeech(() => 'http://pc:5002');
    p.prefetch!('Next.', OPTS);
    await flush();
    expect(downloads).toHaveLength(1);
    expect(players).toHaveLength(0);
  });

  it('a server error surfaces as onError', async () => {
    global.fetch = jest.fn(async () => ({ ok: false, status: 500 }) as Response) as unknown as typeof fetch;
    const p = createNeuralSpeech(() => 'http://pc:5002');
    const cb: SpeakCallbacks = { onDone: jest.fn(), onError: jest.fn() };
    p.speak('x', OPTS, cb);
    await flush();
    await flush();
    expect(cb.onError).toHaveBeenCalled();
  });
});

describe('withFallback (device speech is guaranteed)', () => {
  function fake(id: 'neural' | 'device', opts: { available?: boolean; ready?: boolean; fails?: boolean } = {}) {
    const spoken: string[] = [];
    const p: SpeechProvider = {
      id,
      isAvailable: () => opts.available ?? true,
      prepare: async () => opts.ready ?? true,
      speak: (text, _o, cb) => {
        spoken.push(text);
        if (opts.fails) cb.onError(new Error('down'));
        else cb.onDone();
      },
      stop: jest.fn(),
      listVoices: async () => ['device-voice'],
    };
    return { p, spoken };
  }
  const cb = () => ({ onDone: jest.fn(), onError: jest.fn() });

  it('uses the neural engine while it works', async () => {
    const neural = fake('neural');
    const device = fake('device');
    const f = withFallback(neural.p, device.p);
    await f.prepare!();
    f.speak('a', OPTS, cb());
    expect(f.activeId!()).toBe('neural');
    expect(neural.spoken).toEqual(['a']);
    expect(device.spoken).toEqual([]);
  });

  it('switches to device speech when the server is unreachable at start', async () => {
    const neural = fake('neural', { ready: false });
    const device = fake('device');
    const f = withFallback(neural.p, device.p);
    await f.prepare!();
    f.speak('a', OPTS, cb());
    expect(f.activeId!()).toBe('device');
    expect(device.spoken).toEqual(['a']);
  });

  it('re-speaks a failed segment on the device and stays there', async () => {
    const neural = fake('neural', { fails: true });
    const device = fake('device');
    const f = withFallback(neural.p, device.p);
    await f.prepare!();
    const c = cb();
    f.speak('a', OPTS, c);
    f.speak('b', OPTS, cb());
    expect(c.onDone).toHaveBeenCalledTimes(1);
    expect(c.onError).not.toHaveBeenCalled();
    expect(device.spoken).toEqual(['a', 'b']);
    expect(neural.spoken).toEqual(['a']);
  });

  it('stops both engines and lists device voices', async () => {
    const neural = fake('neural');
    const device = fake('device');
    const f = withFallback(neural.p, device.p);
    f.stop();
    expect(neural.p.stop).toHaveBeenCalled();
    expect(device.p.stop).toHaveBeenCalled();
    await expect(f.listVoices('en')).resolves.toEqual(['device-voice']);
  });
});

describe('emotion hints', () => {
  it('reads punctuation and speech tags in English and Arabic', () => {
    expect(detectEmotion('Run!', 'cried Faisal')).toBe('excited');
    expect(detectEmotion('Over here', 'she whispered')).toBe('whisper');
    expect(detectEmotion('Who is there', 'he asked, trembling')).toBe('fearful');
    expect(detectEmotion('اهرب!', '')).toBe('excited');
    expect(detectEmotion('تعال', 'همس الساحر')).toBe('whisper');
    expect(detectEmotion('من هناك', 'قال وهو خائف')).toBe('fearful');
    expect(detectEmotion('Hello', 'said Noor')).toBe('neutral');
  });

  it('bedtime stories stay calm even when characters exclaim', () => {
    expect(detectEmotion('Yay!', 'cried the fox', true)).toBe('calm');
    const segs = dialogueSegments('The moon rose.\n\n"Goodnight!" said Noor.', castFor(draftFor('bedtime')));
    expect(segs.every((s) => s.emotion === 'calm')).toBe(true);
  });

  it('segments carry emotions, and narrator-only mode keeps them', () => {
    const text = '"Stop!" shouted the witch. "Please," whispered Faisal.';
    expect(dialogueSegments(text, castFor(draftFor('short'))).filter((s) => s.kind === 'dialogue').map((s) => [s.role, s.emotion])).toEqual([
      ['villain', 'excited'],
      ['hero', 'whisper'],
    ]);
    expect(buildSegments(text, draftFor('short'), false).filter((s) => s.kind === 'dialogue').map((s) => [s.role, s.emotion])).toEqual([
      ['narrator', 'excited'],
      ['narrator', 'whisper'],
    ]);
  });

  it('emotions shape device voices', () => {
    const base = { language: 'en' as const, multiVoice: true, rate: 1, volume: 1 };
    expect(speakOptionsFor('hero', [], base, 'whisper').volume).toBeLessThan(speakOptionsFor('hero', [], base).volume);
    expect(speakOptionsFor('hero', [], base, 'excited').rate).toBeGreaterThan(speakOptionsFor('hero', [], base).rate);
  });
});

describe('audio cache keys', () => {
  it('are stable, short and differ per text', () => {
    expect(hashKey('abc')).toBe(hashKey('abc'));
    expect(hashKey('abc')).not.toBe(hashKey('abd'));
    expect(hashKey('مرحبا')).toMatch(/^[0-9a-z]+$/);
  });
});
