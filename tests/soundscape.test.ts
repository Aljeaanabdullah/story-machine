import { cueFor, DUCK, pickAmbience } from '@/lib/audio/sfx';
import { Soundscape, type AudioBackend } from '@/lib/audio/soundscape';
import { draftFor } from './helpers';

function fakeBackend() {
  const handles: { name: string; volume: number; loop: boolean; playing: boolean; released: boolean }[] = [];
  const backend: AudioBackend = {
    load(name) {
      const h = { name, volume: 1, loop: false, playing: false, released: false };
      handles.push(h);
      return {
        play: () => void (h.playing = true),
        pause: () => void (h.playing = false),
        setVolume: (v) => void (h.volume = v),
        setLoop: (l) => void (h.loop = l),
        release: () => {
          h.released = true;
          h.playing = false;
        },
      };
    },
  };
  return { backend, handles };
}

describe('ambience selection', () => {
  const adventure = draftFor('adventure'); // lost-island world

  it('picks the most mentioned setting, in English and Arabic', () => {
    expect(pickAmbience('Rain hammered the roof. More rain came.', adventure)).toBe('rain');
    expect(pickAmbience('The storm broke; thunder rolled over the sea.', adventure)).toBe('storm');
    expect(pickAmbience('Tall trees closed in; the forest whispered.', adventure)).toBe('forest');
    expect(pickAmbience('هبت الرياح على الصحراء والرمال.', adventure)).toBe('wind');
    expect(pickAmbience('دخل الكهف المظلم وسط الظلام والخوف.', adventure)).toBe('suspense');
    expect(pickAmbience('وقف على الشاطئ يراقب الأمواج.', adventure)).toBe('ocean');
  });

  it('falls back to the world default, or nothing for custom worlds', () => {
    expect(pickAmbience('He opened the letter.', adventure)).toBe('ocean');
    expect(pickAmbience('He opened the letter.', { ...adventure, world: { kind: 'preset', id: 'enchanted-forest' } })).toBe('forest');
    expect(pickAmbience('He opened the letter.', { ...adventure, world: { kind: 'custom', description: 'x' } })).toBeNull();
  });

  it('bedtime stays gentle: only soft rain or sea, never suspense', () => {
    expect(pickAmbience('The dark cave was full of shadows.', draftFor('bedtime'))).toBeNull();
    expect(pickAmbience('Soft rain tapped the window.', draftFor('bedtime'))).toBe('rain');
  });

  it('matches whole English words only', () => {
    expect(pickAmbience('She was seated by the brain machine.', { ...adventure, world: { kind: 'custom', description: 'x' } })).toBeNull();
  });
});

describe('effect cues', () => {
  it('fires on sentences that mention them', () => {
    expect(cueFor('The door creaked open.')).toBe('door');
    expect(cueFor('Footsteps echoed behind her.')).toBe('footsteps');
    expect(cueFor('Thunder split the sky.')).toBe('thunder');
    expect(cueFor('A spell of silver light.')).toBe('magic');
    expect(cueFor('فُتح الباب ببطء.')).toBe('door');
    expect(cueFor('دوّى الرعد فوق الجبل.')).toBe('thunder');
    expect(cueFor('تمتم بتعويذة قديمة.')).toBe('magic');
    expect(cueFor('He smiled.')).toBeNull();
  });
});

describe('Soundscape mixer', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('fades the bed in, ducks under narration and further under dialogue', () => {
    const { backend, handles } = fakeBackend();
    const mix = new Soundscape(backend);
    mix.setLevels({ ambience: 0.8, sfx: 1 });
    mix.start('ocean');
    expect(handles[0]).toMatchObject({ name: 'ocean', loop: true, playing: true, volume: 0 });
    jest.advanceTimersByTime(500);
    expect(mix.volume()).toBeCloseTo(0.8);

    mix.setDuck('narration');
    jest.advanceTimersByTime(500);
    expect(mix.volume()).toBeCloseTo(0.8 * DUCK.narration);
    mix.setDuck('dialogue');
    jest.advanceTimersByTime(500);
    expect(mix.volume()).toBeCloseTo(0.8 * DUCK.dialogue);
    expect(handles[0].volume).toBeCloseTo(0.8 * DUCK.dialogue);
  });

  it('keeps the same bed across scenes and swaps when the setting changes', () => {
    const { backend, handles } = fakeBackend();
    const mix = new Soundscape(backend);
    mix.start('forest');
    mix.start('forest');
    expect(handles).toHaveLength(1);
    mix.start('rain');
    expect(handles[0].released).toBe(true);
    expect(mix.playing).toBe('rain');
  });

  it('plays one-shots at the effects level and releases them', () => {
    const { backend, handles } = fakeBackend();
    const mix = new Soundscape(backend);
    mix.setLevels({ ambience: 0.5, sfx: 0.25 });
    mix.cue('door');
    mix.cue(null);
    expect(handles).toHaveLength(1);
    expect(handles[0]).toMatchObject({ name: 'door', loop: false, volume: 0.25, playing: true });
    jest.advanceTimersByTime(6000);
    expect(handles[0].released).toBe(true);
  });

  it('muted levels play nothing at all', () => {
    const { backend, handles } = fakeBackend();
    const mix = new Soundscape(backend);
    mix.setLevels({ ambience: 0, sfx: 0 });
    mix.start('wind');
    mix.cue('magic');
    expect(handles).toHaveLength(0);
  });

  it('volume changes apply immediately; pause and stop release cleanly', () => {
    const { backend, handles } = fakeBackend();
    const mix = new Soundscape(backend);
    mix.start('suspense');
    jest.advanceTimersByTime(500);
    mix.setLevels({ ambience: 1, sfx: 1 });
    expect(handles[0].volume).toBe(1);
    mix.pause();
    expect(handles[0].playing).toBe(false);
    mix.start('suspense');
    expect(handles[0].playing).toBe(true);
    mix.stop();
    expect(handles[0].released).toBe(true);
    expect(mix.playing).toBeNull();
  });
});
