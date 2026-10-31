import { NarrationPlayer } from '@/lib/audio/player';
import { narrationSegments, splitParagraphs, splitSentences } from '@/lib/audio/segment';
import type { SpeakCallbacks, SpeakOptions, SpeechProvider } from '@/lib/audio/types';
import { speakOptionsFor } from '@/lib/audio/voices';

/** Records utterances and lets the test decide when each one finishes. */
function fakeProvider(voices: string[] = []) {
  const spoken: { text: string; options: SpeakOptions; cb: SpeakCallbacks }[] = [];
  const provider: SpeechProvider & { stops: number } = {
    id: 'device',
    stops: 0,
    isAvailable: () => true,
    speak: (text, options, cb) => spoken.push({ text, options, cb }),
    stop() {
      this.stops++;
    },
    listVoices: async () => voices,
  };
  const finishLast = () => spoken[spoken.length - 1].cb.onDone();
  return { provider, spoken, finishLast };
}

const flush = () => new Promise((r) => setTimeout(r, 0));
const SETTINGS = { language: 'en' as const, multiVoice: false, rate: 1 };

describe('narration segmentation', () => {
  it('splits paragraphs the same way the readers do', () => {
    expect(splitParagraphs('One.\n\n  Two.\nThree.  ')).toEqual(['One.', 'Two.', 'Three.']);
  });

  it('splits English and Arabic sentences, keeping closing quotes', () => {
    expect(splitSentences('The sea rose. "Run!" she cried. Why?')).toEqual(['The sea rose.', '"Run!"', 'she cried.', 'Why?']);
    expect(splitSentences('هبت الريح. هل تسمع؟ نعم')).toEqual(['هبت الريح.', 'هل تسمع؟', 'نعم']);
    expect(splitSentences('... !')).toEqual([]);
  });

  it('produces narrator segments tagged with their paragraph', () => {
    expect(narrationSegments('A. B.\n\nC.')).toEqual([
      { role: 'narrator', kind: 'narration', text: 'A.', paragraph: 0 },
      { role: 'narrator', kind: 'narration', text: 'B.', paragraph: 0 },
      { role: 'narrator', kind: 'narration', text: 'C.', paragraph: 1 },
    ]);
  });
});

describe('NarrationPlayer', () => {
  it('reads every segment in order and finishes', async () => {
    const { provider, spoken, finishLast } = fakeProvider();
    const player = new NarrationPlayer(provider);
    player.load(narrationSegments('One. Two.\n\nThree.'), SETTINGS);
    expect(spoken).toHaveLength(0); // never autoplays

    await player.play();
    expect(player.getState()).toMatchObject({ status: 'playing', index: 0, total: 3, paragraph: 0 });
    finishLast();
    finishLast();
    expect(player.getState()).toMatchObject({ status: 'playing', index: 2, paragraph: 1 });
    finishLast();
    expect(player.getState()).toMatchObject({ status: 'done', index: 3 });
    expect(spoken.map((u) => u.text)).toEqual(['One.', 'Two.', 'Three.']);
  });

  it('pauses, ignores the interrupted callback, and resumes on the same sentence', async () => {
    const { provider, spoken } = fakeProvider();
    const player = new NarrationPlayer(provider);
    player.load(narrationSegments('One. Two.'), SETTINGS);
    await player.play();
    spoken[0].cb.onDone();
    player.pause();
    expect(player.getState()).toMatchObject({ status: 'paused', index: 1 });
    expect(provider.stops).toBe(1);

    spoken[1].cb.onDone(); // stale engine callback after stop()
    expect(player.getState().status).toBe('paused');

    player.resume();
    expect(spoken.map((u) => u.text)).toEqual(['One.', 'Two.', 'Two.']);
    spoken[2].cb.onDone();
    expect(player.getState().status).toBe('done');
  });

  it('stop resets to the beginning and loading new text stops playback', async () => {
    const { provider } = fakeProvider();
    const player = new NarrationPlayer(provider);
    player.load(narrationSegments('One. Two.'), SETTINGS);
    await player.play();
    player.stop();
    expect(player.getState()).toEqual({ status: 'idle', index: 0, total: 2 });

    await player.play();
    player.load(narrationSegments('New scene.'), SETTINGS);
    expect(player.getState()).toEqual({ status: 'idle', index: 0, total: 1 });
    expect(provider.stops).toBe(2);
  });

  it('reports an engine error instead of looping', async () => {
    const { provider, spoken } = fakeProvider();
    const player = new NarrationPlayer(provider);
    player.load(narrationSegments('One. Two.'), SETTINGS);
    await player.play();
    spoken[0].cb.onError(new Error('no engine'));
    expect(player.getState().status).toBe('error');
    expect(spoken).toHaveLength(1);
  });

  it('errors when there is nothing to read', async () => {
    const player = new NarrationPlayer(fakeProvider().provider);
    player.load([], SETTINGS);
    await player.play();
    expect(player.getState().status).toBe('error');
  });

  it('a stop during voice loading cancels the start', async () => {
    const { provider, spoken } = fakeProvider(['v1']);
    const player = new NarrationPlayer(provider);
    player.load(narrationSegments('One.'), SETTINGS);
    const started = player.play();
    player.stop();
    await started;
    await flush();
    expect(spoken).toHaveLength(0);
    expect(player.getState().status).toBe('idle');
  });

  it('passes language, rate and the first device voice to the engine', async () => {
    const { provider, spoken } = fakeProvider(['voice-a', 'voice-b']);
    const player = new NarrationPlayer(provider);
    player.load(narrationSegments('مرحبا.'), { language: 'ar', multiVoice: false, rate: 0.85 });
    await player.play();
    expect(spoken[0].options).toEqual(speakOptionsFor('narrator', ['voice-a', 'voice-b'], { language: 'ar', multiVoice: false, rate: 0.85 }));
    expect(spoken[0].options).toMatchObject({ language: 'ar', voice: 'voice-a' });
  });
});
