import { getUserTasks, addTask, updateTask, deleteTask } from './taskManager.js';

import { 
    getReminders, 
    createReminder, 
    updateReminder, 
    deleteReminder,
    getUpcomingReminders,
    completeReminder 
} from './services/reminderService.js';

// Reminders functionality
const reminderInput = document.getElementById('reminderInput');
const reminderTime = document.getElementById('reminderTime');
const reminderPriority = document.getElementById('reminderPriority');
const addReminderBtn = document.getElementById('addReminderBtn');
const reminderList = document.getElementById('reminderList');
const preloadIdeasBtn = document.getElementById('preloadIdeasBtn');
const smartTip = document.getElementById('smartTip');

// Store reminders in localStorage
let reminders = JSON.parse(localStorage.getItem('reminders')) || [];

// Initialize reminder system
export async function initReminders() {
    try {
        // Load existing reminders
        await loadAndDisplayReminders();
        
        // Add event listeners
        if (addReminderBtn) {
            addReminderBtn.addEventListener('click', addReminder);
        }
        if (preloadIdeasBtn) {
            preloadIdeasBtn.addEventListener('click', loadExampleIdeas);
        }
        
        // Start checking reminders every minute
        setInterval(checkUpcomingReminders, 60000);
        
        // Initial check
        await checkUpcomingReminders();
        
        // Setup task integration
        await setupTaskIntegration();
    } catch (error) {
        console.error('Error initializing reminders:', error);
    }
}

// Load example reminder ideas
function loadExampleIdeas() {
    const ideas = [
        "Take a 5-minute stretching break 🧘‍♀️",
        "Drink a glass of water 💧",
        "Check posture and adjust if needed 🪑",
        "Quick meditation session 🧘",
        "Stand up and walk around 🚶‍♀️",
        "Do some eye exercises 👀",
        "Clean your workspace 🧹",
        "Review your todo list ✅"
    ];
    
    // Show random tip
    if (reminderInput) {
        const randomIdea = ideas[Math.floor(Math.random() * ideas.length)];
        reminderInput.value = randomIdea;
    }
}

// Show smart suggestions based on time
function showSmartTip() {
    if (!smartTip) return;
    
    const hour = new Date().getHours();
    let tip = '';
    
    if (hour < 10) {
        tip = "🌅 Morning: Set your top 3 priorities for today";
    } else if (hour < 12) {
        tip = "☀️ Try scheduling your most important tasks before lunch";
    } else if (hour < 15) {
        tip = "🔋 Post-lunch dip? A short walk can boost energy";
    } else if (hour < 18) {
        tip = "📊 Good time to review your progress for the day";
    } else {
        tip = "🌙 Consider setting reminders for tomorrow";
    }
    
    smartTip.textContent = tip;
    smartTip.hidden = false;
}

// Add a new reminder
async function addReminder() {
    const text = reminderInput?.value.trim();
    const time = reminderTime?.value;
    const priority = reminderPriority?.value;
    
    if (!text || !time) {
        alert('Please enter both reminder text and time!');
        return;
    }
    
    try {
        const reminder = await createReminder({
            text,
            time,
            priority,
            active: true
        });
        
        await loadAndDisplayReminders();
        
        // Clear inputs
        if (reminderInput) reminderInput.value = '';
        if (reminderTime) reminderTime.value = '';
    } catch (error) {
        console.error('Failed to add reminder:', error);
        alert('Failed to create reminder. Please try again.');
    }
}

// Save reminders to localStorage
function saveReminders() {
    localStorage.setItem('reminders', JSON.stringify(reminders));
}

// Load and display reminders
async function loadAndDisplayReminders() {
    if (!reminderList) return;
    
    try {
        const userId = localStorage.getItem('userId');
        const reminders = await getReminders(userId);
        
        reminderList.innerHTML = '';
        reminders.sort((a, b) => new Date('1970/01/01 ' + a.time) - new Date('1970/01/01 ' + b.time));
        
        reminders.forEach(reminder => {
            const div = document.createElement('div');
            div.className = `reminder-item priority-${reminder.priority}`;
            
            div.innerHTML = `
                <div class="rem-content">
                    <span class="rem-time">${reminder.time}</span>
                    <span class="rem-text">${reminder.text}</span>
                    <span class="rem-priority">${getPriorityIcon(reminder.priority)}</span>
                </div>
                <div class="rem-actions">
                    <label class="toggle">
                        <input type="checkbox" ${reminder.active ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                    </label>
                    <button class="delete-btn">×</button>
                </div>
            `;
            
            // Add event listeners
            const toggleInput = div.querySelector('input[type="checkbox"]');
            const deleteBtn = div.querySelector('.delete-btn');
            
            if (toggleInput) {
                toggleInput.addEventListener('change', (e) => 
                    handleReminderToggle(reminder._id, e.target.checked)
                );
            }
            
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => 
                    handleReminderDelete(reminder._id)
                );
            }
            
            reminderList.appendChild(div);
        });
    } catch (error) {
        console.error('Failed to load reminders:', error);
    }
    
    // Show smart tip
    showSmartTip();
}

// Get priority icon
function getPriorityIcon(priority) {
    switch (priority) {
        case 'high': return '🔴';
        case 'medium': return '🟡';
        case 'low': return '🟢';
        default: return '⚪';
    }
}

// Toggle reminder active state
export async function handleReminderToggle(id, checked) {
    try {
        await updateReminder(id, { active: checked });
        await loadAndDisplayReminders();
    } catch (error) {
        console.error('Failed to toggle reminder:', error);
        alert('Failed to update reminder. Please try again.');
    }
}

// Delete a reminder
export async function handleReminderDelete(id) {
    try {
        await deleteReminder(id);
        await loadAndDisplayReminders();
    } catch (error) {
        console.error('Failed to delete reminder:', error);
        alert('Failed to delete reminder. Please try again.');
    }
}

// Check for upcoming reminders
async function checkUpcomingReminders() {
    try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            console.warn('No user ID found for checking reminders');
            return;
        }

        const [upcomingReminders, tasks] = await Promise.all([
            getUpcomingReminders(userId),
            getUserTasks()
        ]);

        const now = new Date();
        const currentTime = now.toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit'
        });

        const dueReminders = upcomingReminders.filter(reminder => 
            reminder.active && reminder.time === currentTime
        );
        
        for (const reminder of dueReminders) {
            notifyUser(reminder);
            
            // If reminder is task-related, update task status
            const relatedTask = tasks.find(task => 
                task.text.toLowerCase().includes(reminder.text.toLowerCase())
            );
            
            if (relatedTask) {
                await updateTask(relatedTask.id, { reminded: true });
            }
        }
    } catch (error) {
        console.error('Error checking reminders:', error);
    }
}

// Notify the user
function notifyUser(reminder) {
    // Browser notification
    if ("Notification" in window) {
        if (Notification.permission === "granted") {
            new Notification("Reminder", {
                body: reminder.text,
                icon: "/assets/icon.png"
            });
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    notifyUser(reminder);
                }
            });
        }
    }
    
    // Sound notification
    playNotificationSound();
    
    // Visual notification
    showNotification(reminder);
}

// Play notification sound
function playNotificationSound() {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgA');
    audio.play().catch(e => console.log('Audio play failed:', e));
}

// Show visual notification
function showNotification(reminder) {
    const note = document.createElement('div');
    note.className = 'notification';
    note.textContent = reminder.text;
    document.body.appendChild(note);
    
    setTimeout(() => {
        note.remove();
    }, 5000);
}

// Setup task integration
async function setupTaskIntegration() {
    try {
        const tasks = await getUserTasks();
        const taskSuggestions = document.createElement('div');
        taskSuggestions.className = 'task-suggestions';
        
        tasks.forEach(task => {
            const btn = document.createElement('button');
            btn.className = 'task-suggest-btn';
            btn.textContent = `📋 ${task.text}`;
            btn.onclick = () => {
                if (reminderInput) reminderInput.value = task.text;
            };
            taskSuggestions.appendChild(btn);
        });
        
        if (reminderInput) {
            reminderInput.parentNode.insertBefore(
                taskSuggestions, 
                reminderInput.nextSibling
            );
        }
    } catch (error) {
        console.error('Error setting up task integration:', error);
    }
}