import { AMBIENCES } from '@/lib/audio/sfx';
import { atmosphereFor } from '@/lib/media/atmosphere';
import { presentProse } from '@/lib/media/present';
import { makeProseStory } from '@/lib/story/factory';
import { draftFor } from './helpers';

describe('scene atmosphere (fog + light motes)', () => {
  const draft = draftFor('adventure');

  it('every ambience has valid, gentle settings', () => {
    for (const a of AMBIENCES) {
      const atm = atmosphereFor(draft, a);
      expect(atm.fog).toBeGreaterThanOrEqual(0);
      expect(atm.fog).toBeLessThanOrEqual(0.5); // never hides the artwork
      expect(atm.motes).toBeLessThanOrEqual(12); // cheap on phones
      expect(atm.fogTint).toMatch(/^#[0-9A-F]{6}$/i);
      expect(atm.moteTint).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });

  it('weather reads right: storms are foggy without fireflies, forests glow', () => {
    expect(atmosphereFor(draft, 'storm')).toMatchObject({ motes: 0 });
    expect(atmosphereFor(draft, 'storm').fog).toBeGreaterThan(atmosphereFor(draft, 'ocean').fog);
    expect(atmosphereFor(draft, 'forest').motes).toBeGreaterThan(0);
  });

  it('bedtime uses a soft starry haze regardless of setting', () => {
    expect(atmosphereFor(draftFor('bedtime'), 'suspense')).toEqual(atmosphereFor(draftFor('bedtime'), null));
    expect(atmosphereFor(draftFor('bedtime'), null).motes).toBeGreaterThan(0);
  });

  it('presentations carry ambience and matching atmosphere', () => {
    const story = makeProseStory(draft, 'T', 'Rain hammered the roof. The rain would not stop.');
    const p = presentProse(story, true);
    expect(p.ambience).toBe('rain');
    expect(p.atmosphere).toEqual(atmosphereFor(draft, 'rain'));
  });
});
