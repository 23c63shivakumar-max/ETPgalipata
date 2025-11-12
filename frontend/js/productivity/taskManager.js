import { store } from '../storage.js';

const API_URL = 'http://localhost:5000/api';
const FRONTEND_ORIGIN = window.location.origin;

// Task Management Functions
export async function createTask(taskData) {
  try {
    let userId = store.get('userId');
    if (!userId) userId = localStorage.getItem('userId');
    if (!userId) throw new Error('User not logged in');
    if (typeof userId === 'string') userId = userId.replace(/^"+|"+$/g, '');

    const response = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': FRONTEND_ORIGIN
      },
      credentials: 'include',
      mode: 'cors',
      body: JSON.stringify({
        ...taskData,
        userId
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create task');
    }

    return await response.json();
  } catch (err) {
    console.error('Error creating task:', err);
    throw err;
  }
}

export async function getUserTasks(filters = {}) {
  try {
    const userId = store.get('userId');
    if (!userId) throw new Error('User not logged in');

    const queryParams = new URLSearchParams(filters);
    const response = await fetch(`${API_URL}/tasks/user/${userId}?${queryParams}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Origin': FRONTEND_ORIGIN
      },
      credentials: 'include',
      mode: 'cors'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch tasks');
    }

    return await response.json();
  } catch (err) {
    console.error('Error fetching tasks:', err);
    throw err;
  }
}

export async function updateTask(taskId, updates) {
  try {
    const response = await fetch(`${API_URL}/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update task');
    }

    return await response.json();
  } catch (err) {
    console.error('Error updating task:', err);
    throw err;
  }
}

export async function deleteTask(taskId) {
  try {
    const response = await fetch(`${API_URL}/tasks/${taskId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete task');
    }

    return await response.json();
  } catch (err) {
    console.error('Error deleting task:', err);
    throw err;
  }
}

// Reminder Functions
export async function checkReminders() {
  try {
    const userId = store.get('userId');
    if (!userId) return [];

    const response = await fetch(`${API_URL}/tasks/reminders/${userId}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch reminders');
    }

    const tasks = await response.json();
    return tasks.filter(task => {
      return task.reminders.some(reminder => {
        const reminderTime = new Date(reminder.time);
        return !reminder.notified && reminderTime > new Date();
      });
    });
  } catch (err) {
    console.error('Error checking reminders:', err);
    return [];
  }
}

// Pomodoro Integration
export async function updatePomodoroCount(taskId) {
  try {
    const response = await fetch(`${API_URL}/tasks/${taskId}/pomodoro`, {
      method: 'PUT'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update pomodoro count');
    }

    return await response.json();
  } catch (err) {
    console.error('Error updating pomodoro count:', err);
    throw err;
  }
}

// UI Update Functions
export function createTaskElement(task) {
  const taskEl = document.createElement('div');
  taskEl.className = 'task-item';
  taskEl.dataset.taskId = task._id;
  
  const dueDate = new Date(task.dueDate).toLocaleDateString();
  const reminderTimes = task.reminders
    .map(r => new Date(r.time).toLocaleTimeString())
    .join(', ');

  taskEl.innerHTML = `
    <h4>${task.title}</h4>
    <p>${task.description || ''}</p>
    <div class="task-meta">
      <span class="due-date">Due: ${dueDate}</span>
      <span class="priority ${task.priority}">${task.priority}</span>
      <span class="status">${task.status}</span>
    </div>
    <div class="task-reminders">
      <small>Reminders: ${reminderTimes}</small>
    </div>
    <div class="task-actions">
      <button class="edit-task">Edit</button>
      <button class="delete-task">Delete</button>
      <button class="start-pomodoro">Start Pomodoro</button>
    </div>
  `;

  return taskEl;
}

// Initialize reminder checking
let reminderInterval;
export function initReminders() {
  // Check for reminders every minute
  reminderInterval = setInterval(async () => {
    const upcomingReminders = await checkReminders();
    upcomingReminders.forEach(task => {
      const now = new Date();
      task.reminders.forEach(reminder => {
        const reminderTime = new Date(reminder.time);
        if (!reminder.notified && reminderTime <= now) {
          showNotification(task);
          updateTask(task._id, {
            'reminders.$[elem].notified': true
          }, {
            arrayFilters: [{ 'elem.time': reminder.time }]
          });
        }
      });
    });
  }, 60000); // Check every minute
}

function showNotification(task) {
  // Check if the browser supports notifications
  if (!("Notification" in window)) return;

  // Check if permission is granted
  if (Notification.permission === "granted") {
    new Notification(`Task Reminder: ${task.title}`, {
      body: task.description || 'Time to work on your task!',
      icon: '/assets/notification-icon.png'
    });
  }
  // If not granted and not denied, ask for permission
  else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        showNotification(task);
      }
    });
  }
}