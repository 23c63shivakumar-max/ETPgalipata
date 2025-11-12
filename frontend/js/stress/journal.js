import { store, todayISO } from '../storage.js';

export function journalSave(){
  const mood = document.getElementById('journalMood')?.value || 'neutral';
  const prompt = document.getElementById('journalPrompt')?.value || '';
  const entryText = document.getElementById('journalText')?.value.trim() || '';
  if (!entryText){ alert('Write something first 🙂'); return; }
  const entry = { userId: 'local', date: todayISO(), mood, prompt, entry: entryText };
  const log = store.get('journalLog', []); log.unshift(entry); store.set('journalLog', log); renderJournal();
  document.getElementById('journalText') && (document.getElementById('journalText').value='');
}
export function renderJournal(){ const ul = document.getElementById('journalLog'); if (!ul) return; ul.innerHTML=''; const log = store.get('journalLog', []); log.slice(0,30).forEach(j=>{ const li=document.createElement('li'); 
    li.textContent=`${j.date} ${j.mood} — ${j.prompt} — ${j.entry}`; ul.appendChild(li); }); }