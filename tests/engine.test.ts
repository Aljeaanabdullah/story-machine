import {
  applyScene,
  awaitingNextScene,
  canChoose,
  choose,
  createAdventure,
  currentScene,
  MAX_SCENES,
  mergeMemory,
  needsScene,
  restartAdventure,
} from '@/lib/story/engine';
import type { AdventureState, Scene } from '@/lib/story/types';

function scene(number: number, isEnding = false): Scene {
  return { number, title: `S${number}`, text: 'text', choices: isEnding ? [] : ['A', 'B', 'C'], isEnding, summary: `sum ${number}` };
}

describe('adventure engine', () => {
  it('starts empty and asks for the opening scene', () => {
    const s = createAdventure('Lost Island');
    expect(s).toMatchObject({ maxScenes: MAX_SCENES, scenes: [], choices: [], finished: false });
    expect(s.memory.location).toBe('Lost Island');
    expect(needsScene(s)).toBe(true);
    expect(currentScene(s)).toBeUndefined();
  });

  it('does not need a new scene until a choice is made', () => {
    const s = applyScene(createAdventure('x'), scene(1), {});
    expect(needsScene(s)).toBe(false);
    expect(canChoose(s, 0)).toBe(true);
    const chosen = choose(s, 2);
    expect(chosen.choices).toEqual([{ scene: 1, index: 2, text: 'C' }]);
    expect(awaitingNextScene(chosen)).toBe(true);
    expect(needsScene(chosen)).toBe(true);
  });

  it('ignores invalid or repeated choices and never mutates input', () => {
    const s = applyScene(createAdventure('x'), scene(1), {});
    const snapshot = JSON.stringify(s);
    expect(choose(s, 3)).toBe(s);
    expect(choose(s, -1)).toBe(s);
    expect(choose(s, 1.5)).toBe(s);
    const once = choose(s, 0);
    expect(choose(once, 1)).toBe(once); // already picked for this scene
    expect(JSON.stringify(s)).toBe(snapshot);
  });

  it('refuses scenes that were not requested', () => {
    const s = applyScene(createAdventure('x'), scene(1), {});
    expect(applyScene(s, scene(2), {})).toBe(s);
  });

  it('renumbers scenes and merges memory', () => {
    let s = applyScene(createAdventure('Beach'), { ...scene(99) }, { objective: 'Find the pearl' });
    expect(s.scenes[0].number).toBe(1);
    s = applyScene(choose(s, 0), scene(1), { location: 'Cave', companions: ['Old diver'] });
    expect(s.memory).toEqual({ location: 'Cave', objective: 'Find the pearl', companions: ['Old diver'], discoveries: [] });
  });

  it('plays through to a capped ending and stops', () => {
    let s: AdventureState = createAdventure('x');
    for (let n = 1; n <= MAX_SCENES; n++) {
      expect(needsScene(s)).toBe(true);
      // The model "forgets" to end; the engine must still end at the cap.
      s = applyScene(s, scene(n, false), {});
      if (n < MAX_SCENES) s = choose(s, n % 3);
    }
    expect(s.scenes).toHaveLength(MAX_SCENES);
    expect(s.finished).toBe(true);
    expect(currentScene(s)).toMatchObject({ isEnding: true, choices: [] });
    expect(s.choices).toHaveLength(MAX_SCENES - 1);
    expect(needsScene(s)).toBe(false);
    expect(canChoose(s, 0)).toBe(false);
    expect(applyScene(s, scene(7), {})).toBe(s);
  });

  it('can end early at the climax', () => {
    let s: AdventureState = createAdventure('x');
    for (let n = 1; n <= 4; n++) s = choose(applyScene(s, scene(n), {}), 0);
    s = applyScene(s, scene(5, true), {});
    expect(s.finished).toBe(true);
    expect(s.scenes).toHaveLength(5);
  });

  it('restarts from the opening scene', () => {
    let s = choose(applyScene(createAdventure('x'), scene(1), {}), 0);
    s = choose(applyScene(s, scene(2), {}), 1);
    const r = restartAdventure(s);
    expect(r.scenes).toHaveLength(1);
    expect(r.choices).toEqual([]);
    expect(r.finished).toBe(false);
    expect(canChoose(r, 0)).toBe(true);
  });

  it('mergeMemory keeps previous values for empty patches', () => {
    const prev = { location: 'A', objective: 'B', companions: ['C'], discoveries: ['D'] };
    expect(mergeMemory(prev, {})).toEqual(prev);
    expect(mergeMemory(prev, { location: '', discoveries: [] })).toEqual({ ...prev, discoveries: [] });
  });
});
