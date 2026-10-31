/**
 * Voice configuration, read from env so nothing is hardcoded.
 *
 * EXPO_PUBLIC_TTS_SERVER_URL points at the free local neural TTS server
 * (tools/tts-server, Piper) running on your own PC — it holds no secrets.
 *
 * SECURITY: never put an ElevenLabs (or any) API key in an EXPO_PUBLIC_* variable —
 * those are embedded in the app bundle and can be extracted.
 */
export function getTTSServerUrl(): string {
  return (process.env.EXPO_PUBLIC_TTS_SERVER_URL ?? '').trim().replace(/\/+$/, '');
}
