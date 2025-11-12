import { store } from '../../js/storage.js';
import { createTask, getUserTasks, updateTask, deleteTask } from './taskManager.js';
import { createReminder as apiCreateReminder, getReminders, updateReminder, deleteReminder as apiDeleteReminder } from '../services/reminderService.js';

const DEFAULT_SUGGESTIONS = [
  "Drink a glass of water 💧",
  "Take 5 deep breaths 🌿",
  "Stretch for 2 minutes 🧘",
  "Go for a short walk 🚶",
  "Reflect on your mood 🪞",
  "Review your daily journal",
  "Close your eyes and breathe deeply for 1 minute",
  "Sleep by 10:30 PM for better focus tomorrow",
  "Drink water every 2 hours",
  "Stretch your shoulders"
];

const reminderState = { timers: new Map() };

export function requestNotifyPermission(){ if (!('Notification' in window)) return; if (Notification.permission === 'default') Notification.requestPermission().catch(()=>{}); }

export function notifyUser(title, body){ if ('Notification' in window && Notification.permission==='granted') new Notification(title, { body }); else alert(`${title}\n\n${body}`); }

export function parseTimeToNextMs(hhmm){ const [h,m] = hhmm.split(':').map(Number); const now=new Date(); const target=new Date(); target.setHours(h,m,0,0); if (target.getTime() <= now.getTime()) target.setDate(target.getDate()+1); return target.getTime()-now.getTime(); }

export function scheduleReminder(rem){ clearReminderTimer(rem.id); const ms = parseTimeToNextMs(rem.time); const tid = setTimeout(()=>{ notifyUser('⏰ Reminder', rem.text); }, ms); reminderState.timers.set(rem.id, tid); }
export function clearReminderTimer(id){ const t = reminderState.timers.get(id); if (t){ clearTimeout(t); reminderState.timers.delete(id); } }

export function loadReminders(){ return store.get('reminders', []); }
export function saveReminders(list){ store.set('reminders', list); }

export function renderReminderRow(task) {
  const row = document.createElement('div');
  row.className = 'rem-row';
  const statusCls = task.status === 'completed' ? 'done' : 'pending';
  const dueTime = new Date(task.dueDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  
  row.innerHTML = `
    <div>${task.title}</div>
    <div>${dueTime}</div>
    <div class="rem-status ${statusCls}">${task.status === 'completed' ? '✅' : '⏰'}</div>
    <div class="rem-actions">
      <button data-act="toggle">${task.status === 'completed' ? 'Mark ⏰' : 'Mark ✅'}</button>
      <button data-act="edit">Edit</button>
      <button data-act="delete">Delete</button>
      <button data-act="reschedule">Reschedule</button>
    </div>
  `;

  row.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', async () => {
      const act = btn.getAttribute('data-act');
      if (act === 'toggle') await toggleReminder(task._id);
      if (act === 'edit') await editReminder(task._id);
      if (act === 'delete') await deleteReminder(task._id);
      if (act === 'reschedule') await rescheduleReminder(task._id);
    });
  });

  return row;
}

export async function loadAndDisplayReminders() {
  try {
    const userId = store.get('userId') || localStorage.getItem('userId');
    if (!userId) {
      console.warn('User not authenticated; skipping reminder load');
      return;
    }
    
    // Fetch reminders from the reminder service API (not tasks)
    const reminders = await getReminders(userId);
    const container = document.getElementById('reminderList');
    if (!container) return;
    
    container.innerHTML = '';
    reminders
      .filter(r => r.status === 'pending' || !r.status) // Show pending or all if no status
      .sort((a, b) => new Date(a.nextOccurrence || a.createdAt) - new Date(b.nextOccurrence || b.createdAt))
      .forEach(reminder => {
        const row = document.createElement('div');
        row.className = 'rem-row';
        const statusCls = reminder.status === 'completed' ? 'done' : 'pending';
        const dueTime = reminder.nextOccurrence 
          ? new Date(reminder.nextOccurrence).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          : reminder.time;
        
        row.innerHTML = `
          <div>${reminder.text}</div>
          <div>${dueTime}</div>
          <div class="rem-status ${statusCls}">${reminder.completed ? '✅' : '⏰'}</div>
          <div class="rem-actions">
            <button data-act="toggle">${reminder.completed ? 'Mark ⏰' : 'Mark ✅'}</button>
            <button data-act="edit">Edit</button>
            <button data-act="delete">Delete</button>
            <button data-act="reschedule">Reschedule</button>
          </div>
        `;

        row.querySelectorAll('button').forEach(btn => {
          btn.addEventListener('click', async () => {
            const act = btn.getAttribute('data-act');
            if (act === 'toggle') await toggleReminder(reminder._id);
            if (act === 'edit') await editReminder(reminder._id);
            if (act === 'delete') await deleteReminder(reminder._id);
            if (act === 'reschedule') await rescheduleReminder(reminder._id);
          });
        });

        container.appendChild(row);
      });
  } catch (err) {
    console.error('Failed to load reminders:', err);
    // Silently fail and show empty list (fallback already handled by service)
  }
}

export async function addReminder() {
  // support either #reminderInput or #reminderText depending on markup
  const textEl = document.getElementById('reminderInput') || document.getElementById('reminderText');
  const timeEl = document.getElementById('reminderTime');
  const text = textEl?.value.trim();
  const time = timeEl?.value;
  
  // If text is missing, show suggestions instead of immediately alerting
  if (!text) {
    const suggBox = document.getElementById('reminderSuggestions');
    showSuggestions(textEl || { value: '' }, suggBox);
    if (textEl) textEl.focus();
    return;
  }

  if (!time) {
    alert('Please enter a time for the reminder.');
    if (timeEl) timeEl.focus();
    return;
  }

  try {
    // Create reminder via the reminder service API (not task)
    // Backend expects: text, time, priority, repeat, category, userId
    const reminderData = {
      text: text,
      time: time,  // HH:MM format from input
      priority: 'medium',
      repeat: 'none',
      category: 'general'
    };

    // Create reminder via API (has DB + localStorage fallback)
    const created = await apiCreateReminder(reminderData);
    
    // Clear form
    if (textEl) textEl.value = '';
    if (timeEl) timeEl.value = '';
    
    // Schedule local in-browser notification/alert
    scheduleReminder({ 
      id: created._id || String(Date.now()), 
      text: text, 
      time: time 
    });
    
    // Reload and display all reminders (shows newly created one)
    await loadAndDisplayReminders();
  } catch (err) {
    console.error('Failed to add reminder:', err);
    alert('Failed to create reminder. Please try again.');
  }
}

export async function editReminder(id) {
  try {
    const userId = store.get('userId') || localStorage.getItem('userId');
    const reminders = await getReminders(userId);
    const reminder = reminders.find(r => r._id === id);
    if (!reminder) return;

    const newText = prompt('Edit reminder text:', reminder.text) ?? reminder.text;
    const newTime = prompt('Edit reminder time (HH:MM):', reminder.time) ?? reminder.time;

    // Update reminder via API
    await updateReminder(id, {
      text: newText.trim() || reminder.text,
      time: newTime
    });

    await loadAndDisplayReminders();
    scheduleReminder({ id, text: newText, time: newTime });
  } catch (err) {
    console.error('Failed to edit reminder:', err);
    alert('Failed to edit reminder. Please try again.');
  }
}

export async function deleteReminder(id) {
  try {
    clearReminderTimer(id);
    // Use the reminder API delete function, not tasks
    await apiDeleteReminder(id);
    await loadAndDisplayReminders();
  } catch (err) {
    console.error('Failed to delete reminder:', err);
    alert('Failed to delete reminder. Please try again.');
  }
}

export async function toggleReminder(id) {
  try {
    const userId = store.get('userId') || localStorage.getItem('userId');
    const reminders = await getReminders(userId);
    const reminder = reminders.find(r => r._id === id);
    if (!reminder) return;

    // Use the reminder API to update completed status
    await updateReminder(id, { completed: !reminder.completed });
    await loadAndDisplayReminders();
  } catch (err) {
    console.error('Failed to toggle reminder:', err);
    alert('Failed to update reminder status. Please try again.');
  }
}
export function rescheduleReminder(id){ const list = loadReminders(); const idx = list.findIndex(r=>r.id===id); if (idx<0) return; scheduleReminder(list[idx]); alert('Reminder scheduled for the next occurrence of its time.'); }

export function filterSuggestions(q){ const s=q.toLowerCase(); return DEFAULT_SUGGESTIONS.filter(t=>t.toLowerCase().includes(s)).slice(0,6); }
export function showSuggestions(inputBox, suggBox){
  if (!suggBox) return;
  const q = (inputBox && inputBox.value) ? inputBox.value : '';
  const items = filterSuggestions(q);
  if (!items.length){ suggBox.classList.remove('show'); suggBox.innerHTML=''; return; }
  suggBox.innerHTML = items.map(t=>`<span class="chip" title="${t}">${t}</span>`).join('');
  suggBox.classList.add('show');
  suggBox.querySelectorAll('.chip').forEach(chip=> chip.addEventListener('click', ()=>{ applySuggestionToInputs(chip.textContent); suggBox.classList.remove('show'); }));
}

// Helper to populate both possible reminder input IDs when a suggestion is chosen
function applySuggestionToInputs(text){ const el1 = document.getElementById('reminderText'); const el2 = document.getElementById('reminderInput'); if (el1) el1.value = text; if (el2) el2.value = text; }

export function computeSmartTip() {
  const pmr = store.get('pmrLog', [])[0];
  const journal = store.get('journalLog', [])[0];
  let tip = '';
  
  if (pmr && Number(pmr.relaxationLevel) <= 2) {
    tip = 'You reported low relaxation earlier — try a short meditation now.';
  } else if (journal && ['😢','😡'].includes(journal.mood)) {
    tip = 'Noticed a low mood in your journal — add a reminder to take a mindful walk.';
  }
  
  const el = document.getElementById('smartTip');
  if (tip) {
    el.textContent = `💡 ${tip}`;
    el.hidden = false;
  } else {
    el.hidden = true;
  }
}

// Initialize the reminder system
export function initReminderSystem() {
  // Request notification permission
  requestNotifyPermission();
  
  // Load existing reminders
  loadAndDisplayReminders();
  
  // Set up periodic reminder checks
  setInterval(async () => {
    try {
      const tasks = await getUserTasks({ status: 'pending' });
      const now = new Date();
      
      tasks.forEach(task => {
        task.reminders.forEach(reminder => {
          const reminderTime = new Date(reminder.time);
          if (!reminder.notified && Math.abs(reminderTime - now) < 60000) { // Within 1 minute
            notifyUser(task.title, task.description || 'Time for your scheduled task!');
            updateTask(task._id, {
              'reminders.$[elem].notified': true
            }, {
              arrayFilters: [{ 'elem.time': reminder.time }]
            });
          }
        });
      });
    } catch (err) {
      console.error('Error checking reminders:', err);
    }
  }, 30000); // Check every 30 seconds
  
  // Add event listeners
  const addBtn = document.getElementById('addReminderBtn');
  if (addBtn) {
    addBtn.addEventListener('click', addReminder);
  }
  
  // Set up suggestion filtering and show defaults
  const reminderInputEl = document.getElementById('reminderText') || document.getElementById('reminderInput');
  const suggBox = document.getElementById('reminderSuggestions');
  if (suggBox) {
    if (reminderInputEl) {
      reminderInputEl.addEventListener('input', () => showSuggestions(reminderInputEl, suggBox));
      reminderInputEl.addEventListener('focus', () => showSuggestions(reminderInputEl, suggBox));
    }
    // Show default suggestions even if the input element isn't present yet
    showSuggestions(reminderInputEl || { value: '' }, suggBox);
  }
  
  // Initial smart tip
  computeSmartTip();
}