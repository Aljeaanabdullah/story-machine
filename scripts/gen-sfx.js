#!/usr/bin/env node
/**
 * Synthesises StoryVerse's ambience loops and sound effects from scratch
 * (noise, filters and oscillators) and writes them to assets/sfx/*.wav.
 * Every sound is original and generated here, so there is no licensing to track.
 * Deterministic: the same seed always produces identical files.
 *
 *   node scripts/gen-sfx.js
 */
const fs = require('fs');
const path = require('path');

const RATE = 22050;
const OUT = path.join(__dirname, '..', 'assets', 'sfx');

// ---------- deterministic noise ----------
let seed = 1337;
function rand() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
}
const white = () => rand() * 2 - 1;

// ---------- tiny DSP helpers ----------
function lowpass(cutoff) {
  let y = 0;
  return (x, c = cutoff) => {
    const a = 1 - Math.exp((-2 * Math.PI * c) / RATE);
    y += a * (x - y);
    return y;
  };
}
function highpass(cutoff) {
  const lp = lowpass(cutoff);
  return (x, c) => x - lp(x, c);
}
/** Resonant band-pass (state-variable filter). */
function bandpass(freq, q = 4) {
  let low = 0;
  let band = 0;
  return (x, f = freq) => {
    const fc = 2 * Math.sin((Math.PI * Math.min(f, RATE / 6)) / RATE);
    low += fc * band;
    const high = x - low - band / q;
    band += fc * high;
    return band;
  };
}
function brown() {
  let y = 0;
  return () => {
    y = (y + 0.02 * white()) / 1.02;
    return y * 3.5;
  };
}
const env = (t, attack, decay) => (t < attack ? t / attack : Math.exp(-(t - attack) / decay));

function render(seconds, fn) {
  const n = Math.round(seconds * RATE);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = fn(i / RATE, i);
  return out;
}

/** Makes a seamless loop by cross-fading the tail into the head. */
function loopify(buf, fadeSeconds) {
  const f = Math.round(fadeSeconds * RATE);
  const n = buf.length - f;
  const out = buf.slice(0, n);
  for (let i = 0; i < f; i++) {
    const g = i / f;
    out[i] = buf[i] * g + buf[n + i] * (1 - g);
  }
  return out;
}

function normalize(buf, peak = 0.85) {
  let max = 0;
  for (const v of buf) max = Math.max(max, Math.abs(v));
  if (max === 0) return buf;
  return buf.map((v) => (v / max) * peak);
}

function fadeEdges(buf, seconds = 0.02) {
  const f = Math.round(seconds * RATE);
  for (let i = 0; i < f && i < buf.length; i++) {
    buf[i] *= i / f;
    buf[buf.length - 1 - i] *= i / f;
  }
  return buf;
}

function writeWav(name, buf) {
  const data = Buffer.alloc(buf.length * 2);
  buf.forEach((v, i) => data.writeInt16LE(Math.max(-1, Math.min(1, v)) * 32767, i * 2));
  const h = Buffer.alloc(44);
  h.write('RIFF', 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write('WAVE', 8);
  h.write('fmt ', 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20); // PCM
  h.writeUInt16LE(1, 22); // mono
  h.writeUInt32LE(RATE, 24);
  h.writeUInt32LE(RATE * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write('data', 36);
  h.writeUInt32LE(data.length, 40);
  fs.writeFileSync(path.join(OUT, `${name}.wav`), Buffer.concat([h, data]));
  return data.length + 44;
}

// ---------- ambience loops ----------
function ocean() {
  const b = brown();
  const lp = lowpass(600);
  const hp = highpass(60);
  return render(13, (t) => {
    const swell = 0.35 + 0.65 * Math.pow(Math.sin((Math.PI * t) / 6.5) ** 2, 1.5);
    const hiss = highpass(2000);
    return hp(lp(b(), 300 + 900 * swell)) * swell + 0.04 * swell * hiss(white());
  });
}

function rain() {
  const hp = highpass(1200);
  const lp = lowpass(7000);
  const drops = [];
  return render(11, (t, i) => {
    if (rand() < 0.004) drops.push({ start: i, f: 2500 + rand() * 3000, a: 0.2 + rand() * 0.5 });
    let d = 0;
    for (let k = drops.length - 1; k >= 0; k--) {
      const age = (i - drops[k].start) / RATE;
      if (age > 0.03) drops.splice(k, 1);
      else d += drops[k].a * Math.sin(2 * Math.PI * drops[k].f * age) * Math.exp(-age * 180);
    }
    return 0.5 * lp(hp(white())) + 0.35 * d;
  });
}

function wind() {
  const bp = bandpass(400, 2.5);
  const b = brown();
  return render(13, (t) => {
    const gust = 0.5 + 0.5 * Math.sin((2 * Math.PI * t) / 6.5) * Math.sin((2 * Math.PI * t) / 13);
    const f = 250 + 500 * (0.5 + 0.5 * Math.sin((2 * Math.PI * t) / 13 + 1));
    return bp(white(), f) * (0.4 + 0.6 * gust) + 0.3 * b();
  });
}

function forest() {
  const lp = lowpass(900);
  const birds = [];
  return render(13, (t, i) => {
    if (rand() < 0.00012 && birds.length < 2) birds.push({ start: i, base: 2600 + rand() * 1800, chirps: 2 + Math.floor(rand() * 4) });
    let s = 0;
    for (let k = birds.length - 1; k >= 0; k--) {
      const bird = birds[k];
      const age = (i - bird.start) / RATE;
      const chirp = Math.floor(age / 0.14);
      if (chirp >= bird.chirps) {
        birds.splice(k, 1);
        continue;
      }
      const ct = age - chirp * 0.14;
      if (ct < 0.09) s += 0.25 * Math.sin(2 * Math.PI * (bird.base + 9000 * ct) * ct) * Math.sin((Math.PI * ct) / 0.09);
    }
    const leaves = 0.18 * lp(white()) * (0.6 + 0.4 * Math.sin((2 * Math.PI * t) / 6.5));
    return leaves + s;
  });
}

function suspense() {
  const lp = lowpass(500);
  return render(13, (t) => {
    const trem = 0.75 + 0.25 * Math.sin((2 * Math.PI * t) / 3.25);
    const drone =
      Math.sin(2 * Math.PI * 55 * t) +
      0.8 * Math.sin(2 * Math.PI * 58.2 * t) +
      0.35 * Math.sin(2 * Math.PI * 110.3 * t) +
      0.15 * Math.sin(2 * Math.PI * 164.8 * t + Math.sin(t));
    const air = 0.15 * lp(white());
    return (0.5 * drone + air) * trem;
  });
}

function storm() {
  const r = rain();
  const b = brown();
  const lp = lowpass(120);
  // A distant rolling rumble twice per loop under heavier rain.
  return r.map((v, i) => {
    const t = i / RATE;
    const roll = Math.max(env(t - 2, 0.6, 1.6) * (t > 2 ? 1 : 0), env(t - 7.5, 0.8, 2) * (t > 7.5 ? 1 : 0));
    return 1.2 * v + 2.5 * lp(b()) * roll;
  });
}

// ---------- one-shot effects ----------
function thunder() {
  const b = brown();
  const lp = lowpass(200);
  const crack = highpass(1500);
  return render(4.5, (t) => {
    const strike = t < 0.15 ? crack(white()) * (1 - t / 0.15) * 0.8 : 0;
    const rumble = lp(b(), 90 + 200 * Math.exp(-t)) * env(t, 0.08, 1.3) * (1 + 0.4 * Math.sin(2 * Math.PI * 3 * t));
    return 3 * rumble + strike;
  });
}

function footsteps() {
  const lp = lowpass(400);
  const grit = bandpass(2500, 3);
  const steps = [0.1, 0.62, 1.12, 1.66];
  return render(2.2, (t) => {
    let s = 0;
    for (const at of steps) {
      const d = t - at;
      if (d >= 0 && d < 0.25) s += Math.exp(-d * 28) * (1.6 * lp(white()) + 0.25 * grit(white()) * Math.exp(-d * 60));
    }
    return s;
  });
}

function door() {
  const bp = bandpass(600, 12);
  const lp = lowpass(150);
  let phase = 0;
  return render(2.4, (t) => {
    // Creak: a slowly varying sawtooth through a resonant filter.
    const pitch = 70 + 40 * Math.sin(t * 4.2) + 25 * Math.sin(t * 11);
    phase += pitch / RATE;
    const saw = 2 * (phase % 1) - 1;
    const creak = t < 1.6 ? bp(saw * (0.7 + 0.3 * white()), 500 + 300 * Math.sin(t * 3)) * Math.min(1, t / 0.1) * Math.max(0, 1 - (t - 1.3) / 0.3) : 0;
    const thump = t > 1.75 ? lp(white()) * Math.exp(-(t - 1.75) * 14) * 6 : 0;
    return 0.6 * creak + thump;
  });
}

function magic() {
  const notes = [880, 1108.7, 1318.5, 1760, 2217.5, 2637];
  return render(2.8, (t) => {
    let s = 0;
    notes.forEach((f, k) => {
      const d = t - k * 0.11;
      if (d > 0) s += Math.sin(2 * Math.PI * f * d + 0.5 * Math.sin(2 * Math.PI * 6 * d)) * Math.exp(-d * 2.2) * 0.3;
    });
    const sparkle = rand() < 0.02 ? white() * 0.6 : 0;
    return s + sparkle * Math.exp(-t * 1.2);
  });
}

// ---------- write ----------
fs.mkdirSync(OUT, { recursive: true });
const loops = { ocean, rain, wind, forest, suspense, storm };
const shots = { thunder, footsteps, door, magic };
let total = 0;
for (const [name, fn] of Object.entries(loops)) total += writeWav(name, normalize(loopify(fn(), 1.0), 0.8));
for (const [name, fn] of Object.entries(shots)) total += writeWav(name, fadeEdges(normalize(fn(), 0.9)));
console.log(`[sfx] wrote ${Object.keys(loops).length + Object.keys(shots).length} files, ${(total / 1024 / 1024).toFixed(2)} MB → assets/sfx`);
