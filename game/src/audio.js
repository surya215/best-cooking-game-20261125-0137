// Warung Kilat — every sound is synthesized with WebAudio: no audio files, no
// network, just oscillators and a little noise for the wok sizzle.
let audioCtx = null;
let sizzleNodes = null;

function ensureContext() {
  if (!audioCtx) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    audioCtx = new Ctor();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

/** Unlock audio on the first real gesture (browsers require one). */
export function unlockAudio() {
  ensureContext();
}

/** One short oscillator blip with a quick decay. */
function blip(freq, duration, type, volume, when = 0, slideTo = null) {
  const ctx = ensureContext();
  if (!ctx) return;
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + duration);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

/** A soft filtered-noise hiss while something fries. Loops until stopped. */
function startSizzle() {
  const ctx = ensureContext();
  if (!ctx || sizzleNodes) return;
  const length = ctx.sampleRate * 0.5;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 5200;
  filter.Q.value = 0.6;
  const gain = ctx.createGain();
  gain.gain.value = 0.035;
  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start();
  sizzleNodes = { source, gain };
}

function stopSizzle() {
  if (!sizzleNodes) return;
  try {
    sizzleNodes.gain.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 0.05);
    sizzleNodes.source.stop(audioCtx.currentTime + 0.3);
  } catch { /* already stopped */ }
  sizzleNodes = null;
}

export const sound = {
  click() { blip(660, 0.07, 'triangle', 0.12); },
  add() { blip(520, 0.08, 'sine', 0.16); blip(780, 0.1, 'sine', 0.12, 0.05); },
  cookStart() { blip(300, 0.12, 'sawtooth', 0.07, 0, 520); startSizzle(); },
  stationDone() { blip(880, 0.12, 'sine', 0.18); blip(1174, 0.16, 'sine', 0.16, 0.09); stopSizzle(); },
  burn() { blip(220, 0.25, 'square', 0.1, 0, 110); stopSizzle(); },
  serve() {
    [523, 659, 784, 1046].forEach((f, i) => blip(f, 0.16, 'triangle', 0.16, i * 0.07));
  },
  wrong() { blip(180, 0.18, 'square', 0.1, 0, 120); },
  fail() { blip(320, 0.3, 'sawtooth', 0.1, 0, 140); blip(210, 0.35, 'sawtooth', 0.08, 0.12, 90); },
  newCustomer() { blip(740, 0.09, 'sine', 0.1); blip(988, 0.12, 'sine', 0.1, 0.07); },
  dayWin() {
    [523, 659, 784, 1046, 1318].forEach((f, i) => blip(f, 0.22, 'triangle', 0.16, i * 0.09));
  },
  gameOver() {
    [392, 330, 262, 196].forEach((f, i) => blip(f, 0.3, 'triangle', 0.14, i * 0.14));
  },
  trash() { blip(400, 0.1, 'square', 0.08, 0, 150); },
};

/** Keep the sizzle honest: hiss only while at least one station is cooking. */
export function syncSizzle(anyCooking) {
  if (anyCooking) startSizzle();
  else stopSizzle();
}
