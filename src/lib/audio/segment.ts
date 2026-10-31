import type { VoiceSegment } from './types';

/** Same paragraph split the readers use, so highlight indexes line up. */
export function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n|\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

const SENTENCE = /[^.!?؟…]+(?:[.!?؟…]+["'”»]*|$)/g;

/** Sentence-sized chunks keep pause/resume precise and stay under engine length limits. */
export function splitSentences(text: string): string[] {
  return (text.match(SENTENCE) ?? []).map((s) => s.trim()).filter((s) => /[\p{L}\p{N}]/u.test(s));
}

/** Narrator-only reading: every sentence of every paragraph in order. */
export function narrationSegments(text: string): VoiceSegment[] {
  return splitParagraphs(text).flatMap((p, paragraph) =>
    splitSentences(p).map((s): VoiceSegment => ({ role: 'narrator', kind: 'narration', text: s, paragraph })),
  );
}
