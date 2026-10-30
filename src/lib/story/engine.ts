import type { AdventureMemory, AdventureState, Scene } from './types';

export const MAX_SCENES = 6;

export function createAdventure(startLocation: string, maxScenes = MAX_SCENES): AdventureState {
  return {
    maxScenes,
    scenes: [],
    choices: [],
    memory: { location: startLocation, objective: '', companions: [], discoveries: [] },
    finished: false,
  };
}

export function currentScene(state: AdventureState): Scene | undefined {
  return state.scenes[state.scenes.length - 1];
}

/** The player has picked a choice for the latest scene, but the next scene isn't written yet. */
export function awaitingNextScene(state: AdventureState): boolean {
  const scene = currentScene(state);
  if (!scene || state.finished) return false;
  return state.choices.some((c) => c.scene === scene.number);
}

export function canChoose(state: AdventureState, index: number): boolean {
  const scene = currentScene(state);
  if (!scene || scene.isEnding || state.finished) return false;
  if (awaitingNextScene(state)) return false;
  return Number.isInteger(index) && index >= 0 && index < scene.choices.length;
}

/** Records the player's decision. Pure: returns a new state, or the same one if the choice is invalid. */
export function choose(state: AdventureState, index: number): AdventureState {
  if (!canChoose(state, index)) return state;
  const scene = currentScene(state)!;
  return { ...state, choices: [...state.choices, { scene: scene.number, index, text: scene.choices[index] }] };
}

export function nextSceneNumber(state: AdventureState): number {
  return state.scenes.length + 1;
}

/** True when a new scene may be requested: either the opening or after a recorded choice. */
export function needsScene(state: AdventureState): boolean {
  if (state.finished || state.scenes.length >= state.maxScenes) return false;
  return state.scenes.length === 0 || awaitingNextScene(state);
}

export function mergeMemory(prev: AdventureMemory, patch: Partial<AdventureMemory>): AdventureMemory {
  return {
    location: patch.location || prev.location,
    objective: patch.objective || prev.objective,
    companions: patch.companions ?? prev.companions,
    discoveries: patch.discoveries ?? prev.discoveries,
  };
}

/** Appends a validated scene. Never lets the adventure exceed maxScenes. */
export function applyScene(state: AdventureState, scene: Scene, memory: Partial<AdventureMemory>): AdventureState {
  if (!needsScene(state)) return state;
  const number = nextSceneNumber(state);
  const ending = scene.isEnding || number >= state.maxScenes;
  const fixed: Scene = { ...scene, number, isEnding: ending, choices: ending ? [] : scene.choices };
  return {
    ...state,
    scenes: [...state.scenes, fixed],
    memory: mergeMemory(state.memory, memory),
    finished: ending,
  };
}

/** Drops everything after the opening so the player can replay from scene 1. */
export function restartAdventure(state: AdventureState): AdventureState {
  const first = state.scenes[0];
  return { ...state, scenes: first ? [first] : [], choices: [], finished: first?.isEnding ?? false };
}
