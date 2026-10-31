#!/usr/bin/env node
/**
 * Renders the bundled 5-second demo clip: a Ken Burns photo animation of the
 * Lost Island artwork with fades, a vignette and the original ocean ambience.
 * Free and offline: needs only FFmpeg (set FFMPEG=path, or have ffmpeg on PATH).
 *
 *   FFMPEG=/path/to/ffmpeg node scripts/make-demo-video.js
 */
const { execFileSync } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');
const ffmpeg = process.env.FFMPEG || 'ffmpeg';
const filter =
  "[0:v]scale=2560:-2,zoompan=z='1.0+0.0009*on':x='iw/2-(iw/zoom/2)+on*1.2':y='ih/2-(ih/zoom/2)':d=150:s=1280x720:fps=30," +
  'vignette=PI/5,eq=contrast=1.04:saturation=1.08,fade=t=in:st=0:d=0.8,fade=t=out:st=4.2:d=0.8,format=yuv420p[v];' +
  '[1:a]atrim=0:5,afade=t=in:st=0:d=0.8,afade=t=out:st=4.2:d=0.8,volume=0.8[a]';

execFileSync(
  ffmpeg,
  [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-loop', '1', '-i', path.join(root, 'assets/art/world-lost-island.webp'),
    '-i', path.join(root, 'assets/sfx/ocean.wav'),
    '-filter_complex', filter, '-map', '[v]', '-map', '[a]', '-t', '5',
    '-c:v', 'libx264', '-profile:v', 'main', '-preset', 'slow', '-crf', '24',
    '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart',
    path.join(root, 'assets/video/demo-lost-island.mp4'),
  ],
  { stdio: 'inherit' },
);
console.log('[video] wrote assets/video/demo-lost-island.mp4');
