let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Resume if suspended (browser autoplay policy)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(frequency, duration, type = 'sine', volume = 0.3, delay = 0) {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.value = volume;

  // Fade out to avoid clicks
  gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration);
}

// === Sound effects ===

// Correct answer — bright ascending two-note chime
export function sfxCorrect() {
  playTone(523.25, 0.12, 'sine', 0.25, 0);     // C5
  playTone(659.25, 0.2, 'sine', 0.25, 0.1);     // E5
}

// Wrong answer — low descending buzz
export function sfxWrong() {
  playTone(311.13, 0.15, 'sawtooth', 0.12, 0);   // Eb4
  playTone(233.08, 0.25, 'sawtooth', 0.12, 0.12); // Bb3
}

// Flip card — soft click/pop
export function sfxFlip() {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 1200;
  osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.06);
  gain.gain.value = 0.15;
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.06);
}

// Mark as learned — satisfying ding
export function sfxLearned() {
  playTone(880, 0.08, 'sine', 0.2, 0);      // A5
  playTone(1108.73, 0.15, 'sine', 0.2, 0.07); // C#6
  playTone(1318.51, 0.25, 'sine', 0.2, 0.15); // E6
}

// Lesson complete — triumphant fanfare
export function sfxLessonComplete() {
  playTone(523.25, 0.15, 'sine', 0.2, 0);      // C5
  playTone(659.25, 0.15, 'sine', 0.2, 0.12);   // E5
  playTone(783.99, 0.15, 'sine', 0.2, 0.24);   // G5
  playTone(1046.50, 0.4, 'sine', 0.25, 0.36);  // C6
}

// Perfect score — sparkly cascade
export function sfxPerfect() {
  const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
  notes.forEach((freq, i) => {
    playTone(freq, 0.2, 'sine', 0.15, i * 0.08);
  });
}

// Button tap — subtle tick
export function sfxTap() {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 800;
  gain.gain.value = 0.08;
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.03);
}

// Next question — soft whoosh-like transition
export function sfxNext() {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 400;
  osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
  gain.gain.value = 0.1;
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.1);
}

// Streak / combo — ascending ping
export function sfxStreak(combo) {
  const baseFreq = 600 + Math.min(combo, 10) * 50;
  playTone(baseFreq, 0.1, 'sine', 0.15, 0);
  playTone(baseFreq * 1.25, 0.15, 'sine', 0.15, 0.05);
}

// Unlock / new content — magical shimmer
export function sfxUnlock() {
  playTone(440, 0.1, 'sine', 0.12, 0);
  playTone(554.37, 0.1, 'sine', 0.12, 0.08);
  playTone(659.25, 0.1, 'sine', 0.12, 0.16);
  playTone(880, 0.3, 'triangle', 0.15, 0.24);
}

// Review rating — subtle confirmation
export function sfxRate() {
  playTone(660, 0.06, 'sine', 0.1, 0);
  playTone(880, 0.1, 'sine', 0.1, 0.05);
}
