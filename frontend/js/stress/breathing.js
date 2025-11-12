import { store, todayISO } from '../storage.js';
import { saveSession, getUserSessions } from '../sessionStorage.js';

let breathTimer = null, breathElapsed = 0, breathTotalMs = 0, breathPlaying = false, audioCtx=null, breathOsc=null;

function bubble(){ return document.getElementById('breathBubble'); }
function cue(){ return document.getElementById('breathCue'); }
function timeLbl(){ return document.getElementById('breathTime'); }
function progressBar(){ return document.getElementById('breathProgress'); }

export function parsePattern(val){
  const parts = val.split('-').map(n=>parseInt(n,10)||0);
  if (parts.length===3) return { inhale: parts[0], hold: parts[1], exhale: parts[2] };
  return { inhale: parts[0]||4, hold: parts[1]||4, exhale: parts[2]||4 };
}

export function formatMMSS(ms){ const s=Math.floor(ms/1000); const m=Math.floor(s/60); return `${String(m).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`; }

export function beep(on){
  if (!on){ if (breathOsc){ breathOsc.stop(); breathOsc.disconnect(); breathOsc=null; } return; }
  try{
    if (!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
    breathOsc = audioCtx.createOscillator();
    breathOsc.frequency.value = 432;
    const gain = audioCtx.createGain(); gain.gain.value = 0.02;
    breathOsc.connect(gain).connect(audioCtx.destination);
    breathOsc.start();
  }catch(e){ console.warn('Audio not available', e); }
}

function breathUpdateUI(phase, remain){ cue() && (cue().textContent = `${phase}… ${Math.ceil(remain)}`);
  if (bubble()) bubble().style.animationPlayState = breathPlaying ? 'running' : 'paused'; }

function breathCycle(pattern){
  const timeline = [ {phase:'Inhale',dur:pattern.inhale}, {phase:'Hold',dur:pattern.hold}, {phase:'Exhale',dur:pattern.exhale} ];
  return { total: pattern.inhale+pattern.hold+pattern.exhale, timeline };
}

async function saveBreathingSession(duration, pattern) {
  try {
    const userId = store.get('userId');
    if (!userId) {
      console.warn('User not logged in, session not saved');
      return;
    }

    const sessionData = {
      userId,
      type: 'breathing',
      duration,
      completed: true,
      metrics: {
        breathPattern: pattern
      }
    };

    const response = await saveSession(sessionData);
    console.log('Breathing session saved:', response);

    // Update the log display
    const logEl = document.getElementById('breathLog');
    if (logEl) {
      const entry = document.createElement('li');
      entry.textContent = `${todayISO()} - ${duration}min ${pattern} pattern`;
      logEl.insertBefore(entry, logEl.firstChild);
    }
  } catch (err) {
    console.error('Failed to save breathing session:', err);
  }
}

export async function loadBreathingSessions() {
  try {
    const userId = store.get('userId');
    if (!userId) return;

    const sessions = await getUserSessions(userId, 'breathing');
    const logEl = document.getElementById('breathLog');
    if (logEl && sessions.length) {
      logEl.innerHTML = sessions
        .map(s => `<li>${new Date(s.date).toLocaleDateString()} - ${s.duration}min ${s.metrics.breathPattern} pattern</li>`)
        .join('');
    }
  } catch (err) {
    console.error('Failed to load breathing sessions:', err);
  }
}

export function startBreathing(){
  if (breathPlaying) return;
  const minutes = Math.max(1, parseInt(document.getElementById('breathMinutes')?.value,10) || 5);
  const pattern = document.getElementById('breathPattern')?.value || '4-4-4';
  const parsedPattern = parsePattern(pattern);
  const { timeline } = breathCycle(parsedPattern);
  breathTotalMs = minutes*60*1000;
  const startTime = Date.now() - breathElapsed;
  breathPlaying = true;

  let cycleIdx = 0, phaseElapsed = 0;
  let phase = timeline[cycleIdx].phase, phaseDur = timeline[cycleIdx].dur;

  const tick = () => {
    if (!breathPlaying) return;
    const now = Date.now();
    breathElapsed = now - startTime;
    if (breathElapsed >= breathTotalMs){ stopBreathing(true); return; }

    phaseElapsed += 0.1;
    const remain = Math.max(0, phaseDur - phaseElapsed);
    breathUpdateUI(phase, remain);
    if (remain <= 0.05){ cycleIdx = (cycleIdx+1)%timeline.length; phase = timeline[cycleIdx].phase; phaseDur = timeline[cycleIdx].dur; phaseElapsed=0; }
    timeLbl() && (timeLbl().textContent = formatMMSS(breathElapsed));
    progressBar() && (progressBar().style.width = `${(breathElapsed/breathTotalMs)*100}%`);
    breathTimer = setTimeout(tick, 100);
  };
  tick();
}

export function pauseBreathing(){ breathPlaying = false; clearTimeout(breathTimer); }
export function stopBreathing(completed=false){ breathPlaying=false; clearTimeout(breathTimer);
  if (bubble()) bubble().style.animationPlayState='paused';
  if (breathOsc){ breathOsc.stop(); breathOsc.disconnect(); breathOsc=null; }
  if (completed && cue()) cue().textContent = 'Great job! Completed.';
}
export function resetBreathing(){ pauseBreathing(); breathElapsed=0; breathTotalMs=0; if (timeLbl()) timeLbl().textContent='00:00'; if (progressBar()) progressBar().style.width='0%'; if (cue()) cue().textContent='Inhale… 4'; }

export function saveBreathLog(){
  const minutes = Math.max(1, parseInt(document.getElementById('breathMinutes')?.value,10) || 5);
  const log = store.get('breathLog', []);
  const entry = { strategy: 'Deep Breathing', completedOn: todayISO(), duration: minutes };
  log.unshift(entry); store.set('breathLog', log); renderBreathLog();
}

export function renderBreathLog(){
  const log = store.get('breathLog', []);
  const ul = document.getElementById('breathLog'); if (!ul) return; ul.innerHTML='';
  log.slice(0,20).forEach(item=>{ const li = document.createElement('li'); li.textContent = `${item.completedOn} — ${item.strategy} (${item.duration} min)`; ul.appendChild(li); });
}