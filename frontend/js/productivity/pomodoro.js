// pomodoro.js
import { store, todayISO } from '../storage.js';

let pomPhase = 'Focus';
let pomMs = 25 * 60 * 1000;
let pomTimer = null;
let pomRunning = false;
let pomElapsed = 0;

// Whether the timer should auto-resume when the tab becomes visible again.
const resumeOnVisible = false;

function formatTime(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function tryPlaySound() {
  const checked = document.getElementById('pomSound')?.checked;
  if (!checked) return;
  const src = '/assets/sound/beep_short.ogg';
  try {
    const a = new Audio(src);
    a.play().catch(() => {
      // fallback to WebAudio short beep
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = 880;
        o.connect(g);
        g.connect(ctx.destination);
        o.start();
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
        setTimeout(() => { o.stop(); ctx.close(); }, 300);
      } catch (e) { /* ignore */ }
    });
  } catch (e) {
    // last-resort: no-op
  }
}

export function updatePomUI() {
  const label = document.getElementById('pomLabel');
  const clock = document.getElementById('pomClock');
  if (label) label.textContent = pomPhase;
  if (clock) clock.textContent = formatTime(pomMs - pomElapsed);
}

function _onTickLoop(startTime) {
  if (!pomRunning) return;
  pomElapsed = Date.now() - startTime;
  if (pomElapsed >= pomMs) {
    // phase finished
    pomRunning = false;
    pomElapsed = 0;
    tryPlaySound();
    if (pomPhase === 'Focus') {
      pomPhase = 'Break';
      pomMs = 5 * 60 * 1000;
      incPomCount();
    } else {
      pomPhase = 'Focus';
      pomMs = 25 * 60 * 1000;
    }
    updatePomUI();
    // auto-start next phase
    pomStart();
    return;
  }
  updatePomUI();
  pomTimer = setTimeout(() => _onTickLoop(startTime), 200);
}

export function pomStart() {
  if (pomRunning) return;
  // ensure pomMs matches the selected session (if present)
  const sel = document.getElementById('pomSession');
  if (sel && sel.value && pomPhase === 'Focus') {
    const mins = parseInt(sel.value, 10) || 25;
    pomMs = mins * 60 * 1000;
  }
  const start = Date.now() - pomElapsed;
  pomRunning = true;
  // ensure any previous timer is cleared
  if (pomTimer) { clearTimeout(pomTimer); pomTimer = null; }
  _onTickLoop(start);
}

export function pomPause() {
  if (!pomRunning) return;
  pomRunning = false;
  if (pomTimer) { clearTimeout(pomTimer); pomTimer = null; }
}

export function pomReset() {
  pomPause();
  pomPhase = 'Focus';
  // set duration from selector if present
  const sel = document.getElementById('pomSession');
  if (sel && sel.value) {
    const mins = parseInt(sel.value, 10) || 25;
    pomMs = mins * 60 * 1000;
  } else {
    pomMs = 25 * 60 * 1000;
  }
  pomElapsed = 0;
  updatePomUI();
}

export function incPomCount() {
  const key = 'tmCount-' + todayISO();
  const val = (store.get(key, 0) || 0) + 1;
  store.set(key, val);
  const el = document.getElementById('tmDone');
  if (el) el.textContent = val;
}

export function loadPomCount() {
  const key = 'tmCount-' + todayISO();
  const el = document.getElementById('tmDone');
  if (el) el.textContent = store.get(key, 0) || 0;
}

// Pause the timer when the page becomes hidden to avoid time drift.
let _wasRunningBeforeHidden = false;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    _wasRunningBeforeHidden = pomRunning;
    if (pomRunning) pomPause();
  } else {
    if (resumeOnVisible && _wasRunningBeforeHidden) pomStart();
  }
});
