 
import * as Login from './login.js';
import * as Contact from './contact.js';
import * as Breathing from './stress/breathing.js';
import * as PMR from './stress/pmr.js';
import * as Journal from './stress/journal.js';
import * as Mind from './stress/mindfulness.js';
import * as Physical from './stress/physical.js';
import * as Pomodoro from './productivity/pomodoro.js';
import * as Rem from './productivity/reminder.js';
import * as Tasks from './productivity/tasks.js';
import * as Calm from './games/claimclick.js';
import * as Bubble from './games/bubblepop.js';
import * as Color from './games/colorgame.js';
import { store } from './storage.js';

export function showPage(id){ document.querySelectorAll('main section').forEach(sec => sec.classList.add('hidden')); const el=document.getElementById(id); if (el) el.classList.remove('hidden'); }
export function toggleSidebar(){ document.getElementById('sidebar') && document.getElementById('sidebar').classList.toggle('hidden'); }

function initTabs(){ const btns = Array.from(document.querySelectorAll('.strategy-tab')); btns.forEach(btn=> btn.addEventListener('click', ()=>{ btns.forEach(b=>b.classList.remove('active')); document.querySelectorAll('.strategy-panel').forEach(p=>p.classList.remove('show')); btn.classList.add('active'); const id = btn.dataset.target; document.getElementById(`panel-${id}`) && document.getElementById(`panel-${id}`).classList.add('show'); })); }

document.addEventListener('DOMContentLoaded', ()=>{
  // UI wiring
  initTabs();

  // wire header / nav / sidebar buttons (replace previous inline onclicks)
  document.getElementById('menuIcon')?.addEventListener('click', toggleSidebar);
  document.getElementById('headerLoginBtn')?.addEventListener('click', ()=> showPage('loginPage'));
  document.querySelectorAll('.topnav .nav-btn').forEach(b=> b.addEventListener('click', ()=>{ const t=b.dataset.target; if (t) showPage(t); }));
  document.querySelectorAll('.sidebar .sidebar-link').forEach(b=> b.addEventListener('click', ()=>{ const t=b.dataset.target; if (t) showPage(t); toggleSidebar(); }));

  // profile / contact handlers moved from inline
  document.getElementById('editProfileBtn')?.addEventListener('click', Login.editProfile);
  document.getElementById('contactSend')?.addEventListener('click', Contact.sendContact);

  // login/register bindings
  document.getElementById('loginBtn')?.addEventListener('click', Login.handleLogin);
  document.getElementById('registerBtn')?.addEventListener('click', Login.handleRegister);

  // earn points and add post (peer support)
  document.getElementById('earnPointsBtn')?.addEventListener('click', ()=>{
    const pEl=document.getElementById('points'); const profEl=document.getElementById('pointsProfile'); let cur = parseInt(pEl?.textContent||'0',10) || 0; cur += 10; if(pEl) pEl.textContent = cur; if(profEl) profEl.textContent = cur; localStorage.setItem('points', JSON.stringify(cur));
  });
  document.getElementById('addPostBtn')?.addEventListener('click', ()=>{
    const txt = (document.getElementById('postInput')?.value||'').trim(); if (!txt) return alert('Please write something to post.'); const ul=document.getElementById('postsList'); const li=document.createElement('li'); li.textContent = txt; if (ul) ul.prepend(li); document.getElementById('postInput').value='';
  });

  // initialize points display
  try{ const pts = JSON.parse(localStorage.getItem('points')) || 0; document.getElementById('points') && (document.getElementById('points').textContent = pts); document.getElementById('pointsProfile') && (document.getElementById('pointsProfile').textContent = pts); }catch(e){}
  // login
  Login.initLogin();
  // contact
  Contact.initContact();

  // breathing
  document.getElementById('breathStart')?.addEventListener('click', Breathing.startBreathing);
  document.getElementById('breathPause')?.addEventListener('click', Breathing.pauseBreathing);
  document.getElementById('breathReset')?.addEventListener('click', Breathing.resetBreathing);
  document.getElementById('breathSave')?.addEventListener('click', Breathing.saveBreathLog);
  document.getElementById('breathAudio')?.addEventListener('change', (e)=> Breathing.beep(e.target.checked));
  Breathing.renderBreathLog();

  // PMR
  document.getElementById('pmrPrev')?.addEventListener('click', PMR.pmrPrev);
  document.getElementById('pmrNext')?.addEventListener('click', PMR.pmrNext);
  document.getElementById('pmrPlay')?.addEventListener('click', PMR.pmrGuide);
  document.getElementById('pmrRelax')?.addEventListener('input', (e)=> document.getElementById('pmrRelaxVal') && (document.getElementById('pmrRelaxVal').textContent = e.target.value));
  document.getElementById('pmrSave')?.addEventListener('click', PMR.pmrSave);
  PMR.highlightPMR(); PMR.renderPMRLog && PMR.renderPMRLog();

  // journaling
  document.getElementById('journalSave')?.addEventListener('click', Journal.journalSave);
  document.getElementById('journalClear')?.addEventListener('click', ()=> document.getElementById('journalText') && (document.getElementById('journalText').value=''));
  Journal.renderJournal();

  // mindfulness
  document.getElementById('mindStart')?.addEventListener('click', Mind.mindStart);
  document.getElementById('mindPause')?.addEventListener('click', Mind.mindPause);
  document.getElementById('mindReset')?.addEventListener('click', Mind.mindReset);
  document.getElementById('mindBookmark')?.addEventListener('click', Mind.bookmarkMind);
  Mind.renderMindLog(); Mind.renderMindBookmarks();

  // physical
  document.getElementById('actSave')?.addEventListener('click', Physical.actSave);
  Physical.renderActLog(); Physical.drawActChart();

  // pomodoro
  document.getElementById('pomStart')?.addEventListener('click', Pomodoro.pomStart);
  document.getElementById('pomPause')?.addEventListener('click', Pomodoro.pomPause);
  document.getElementById('pomReset')?.addEventListener('click', Pomodoro.pomReset);
  Pomodoro.loadPomCount();
  // Ensure the Pomodoro UI is initialized (show initial clock)
  Pomodoro.updatePomUI();
  // When session length changes, reset timer to reflect selection
  document.getElementById('pomSession')?.addEventListener('change', () => Pomodoro.pomReset());

  // reminders
  Rem.initReminderSystem(); // Initialize the new reminder system with database integration
  
  // Setup reminder form quick-fill
  document.getElementById('preloadIdeasBtn')?.addEventListener('click', ()=>{ 
    const box=document.getElementById('reminderText'); 
    if (box) box.value='Drink a glass of water 💧'; 
    const t=document.getElementById('reminderTime'); 
    if (t) t.value='10:00'; 
    document.getElementById('reminderSuggestions') && 
      Rem.showSuggestions(document.getElementById('reminderText'), document.getElementById('reminderSuggestions')); 
  });
  
  // Setup suggestion system
  const remText = document.getElementById('reminderText'); 
  if (remText){ 
    remText.addEventListener('input', ()=> 
      Rem.showSuggestions(remText, document.getElementById('reminderSuggestions'))
    ); 
    remText.addEventListener('focus', ()=> 
      Rem.showSuggestions(remText, document.getElementById('reminderSuggestions'))
    ); 
  }
  
  // Close suggestions on outside click
  document.addEventListener('click', (e)=>{ 
    const s=document.getElementById('reminderSuggestions'); 
    if (s && !s.contains(e.target) && e.target !== remText) s.classList.remove('show'); 
  });
  
  // Compute initial smart tip
  Rem.computeSmartTip();

  // tasks — load from backend
  document.getElementById('addTaskBtn')?.addEventListener('click', Tasks.tmAddTask);
  const taskInput = document.getElementById('taskInput'); if (taskInput) taskInput.addEventListener('keydown', (e)=>{ if (e.key==='Enter') Tasks.tmAddTask(); });
  Tasks.tmShowTasks().catch(err => console.error('Error loading tasks:', err));

  // games
  Calm.initCalmClick(); Bubble.initBubblePop(); Color.initColorGame();

});