import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import { hashKey } from '@/lib/audio/cache';
import { isMp4Name } from './sceneVideo';

export type ImportResult = { ok: true; uri: string } | { ok: false; reason: 'canceled' | 'not_video' | 'failed' };

/**
 * Lets the user pick an MP4 (e.g. made with a free online video tool) and copies it
 * into the app's documents folder so it survives cache clears. On web the browser
 * keeps the file only for the current session.
 */
export async function importSceneVideo(key: string): Promise<ImportResult> {
  try {
    const picked = await DocumentPicker.getDocumentAsync({ type: ['video/mp4', 'video/quicktime', 'video/*'], copyToCacheDirectory: true });
    if (picked.canceled || !picked.assets?.[0]) return { ok: false, reason: 'canceled' };
    const asset = picked.assets[0];
    if (!isMp4Name(asset.name, asset.mimeType) && !asset.mimeType?.startsWith('video/')) return { ok: false, reason: 'not_video' };
    if (Platform.OS === 'web') return { ok: true, uri: asset.uri };

    const dir = new Directory(Paths.document, 'scene-videos');
    dir.create({ intermediates: true, idempotent: true });
    const ext = (asset.name.match(/\.(mp4|m4v|mov)$/i)?.[1] ?? 'mp4').toLowerCase();
    const dest = new File(dir, `${hashKey(key)}-${Date.now().toString(36)}.${ext}`);
    new File(asset.uri).copy(dest);
    return { ok: true, uri: dest.uri };
  } catch {
    return { ok: false, reason: 'failed' };
  }
}

/** Deletes an imported copy when the user removes it (bundled and web clips are left alone). */
export function deleteImportedVideo(uri: string | undefined) {
  if (!uri || Platform.OS === 'web' || !uri.includes('scene-videos')) return;
  try {
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch {
    // already gone
  }
}

/**
 * Keeps a locally generated clip with the story: on the phone it is downloaded into
 * the documents folder so it plays without the PC; on web (or if the copy fails) the
 * server URL is used directly.
 */
export async function saveGeneratedVideo(url: string, key: string): Promise<string> {
  if (Platform.OS === 'web') return url;
  try {
    const dir = new Directory(Paths.document, 'scene-videos');
    dir.create({ intermediates: true, idempotent: true });
    const file = await File.downloadFileAsync(url, new File(dir, `${hashKey(key)}-ai-${Date.now().toString(36)}.mp4`), { idempotent: true });
    return file.uri;
  } catch {
    return url;
  }
}
