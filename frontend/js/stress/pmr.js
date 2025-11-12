// pmr.js — Progressive Muscle Relaxation
import { store, todayISO } from '../storage.js';
let pmrIndex=0, pmrTimer=null, pmrPlaying=false;

export function highlightPMR(){
  const items = Array.from(document.querySelectorAll('#pmrSteps li'));
  items.forEach((el,i)=> el.classList.toggle('active', i===pmrIndex));
}
export function pmrPrev(){ pmrIndex = Math.max(0, pmrIndex-1); highlightPMR(); }
export function pmrNext(){ const items = Array.from(document.querySelectorAll('#pmrSteps li')); pmrIndex = Math.min(items.length-1, pmrIndex+1); highlightPMR(); }

export function pmrBeep(ms=500, freq=528){
  if (!window.AudioContext && !window.webkitAudioContext) return;
  try{
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx(); const osc = ctx.createOscillator(); const g = ctx.createGain();
    osc.frequency.value = freq; g.gain.value = 0.03; osc.connect(g).connect(ctx.destination); osc.start();
    setTimeout(()=>{ osc.stop(); ctx.close(); }, ms);
  }catch(e){ console.warn(e); }
}

export function pmrGuide(){
  if (pmrPlaying) { clearInterval(pmrTimer); pmrPlaying=false; return; }
  pmrPlaying = true; pmrBeep(250,432);
  let phase = 'Tense', remain = 5; highlightPMR();
  pmrTimer = setInterval(()=>{
    if (!pmrPlaying) return;
    if (remain<=0){ phase = (phase==='Tense')? 'Release':'Tense'; remain = 5; pmrBeep(180, phase==='Tense'?440:392); if (phase==='Tense'){ pmrNext(); } }
    document.getElementById('pmrPlay').textContent = `${phase} (${remain}s)`;
    remain--;
  },1000);
}

export function pmrSave(){
  const relax = parseInt(document.getElementById('pmrRelax')?.value,10) || 3;
  const notes = document.getElementById('pmrNotes')?.value.trim();
  const entry = { strategy: 'Progressive Muscle Relaxation', relaxationLevel: relax, notes: notes||null, date: todayISO() };
  const log = store.get('pmrLog', []); log.unshift(entry); store.set('pmrLog', log); renderPMRLog();
  document.getElementById('pmrNotes') && (document.getElementById('pmrNotes').value='');
}
export function renderPMRLog(){ const ul = document.getElementById('pmrLog');
     if (!ul) return; ul.innerHTML='';
      const log = store.get('pmrLog', []);
       log.slice(0,20).forEach(r=>{ const li=document.createElement('li');
         li.textContent=`${r.date} — Relaxation ${r.relaxationLevel}/5${r.notes?` — ${r.notes}`:''}`;
          ul.appendChild(li); 
        });
     }