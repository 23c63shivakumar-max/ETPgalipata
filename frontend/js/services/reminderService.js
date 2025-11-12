// Reminder Service - Handles API calls for reminders
import { store } from '../storage.js';
const API_BASE_URL = 'http://localhost:5000/api';

export async function getReminders(userId) {
    try {
        const response = await fetch(`${API_BASE_URL}/reminders/user/${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching reminders:', error);
        // Fallback to local storage if API fails
        return JSON.parse(localStorage.getItem('reminders') || '[]');
    }
}

export async function createReminder(reminderData) {
    try {
        // prefer structured store value, but tolerate raw localStorage
        let userId = store.get('userId') || localStorage.getItem('userId');
        if (!userId) throw new Error('User not authenticated');
        if (typeof userId === 'string') userId = userId.replace(/^"+|"+$/g, '');

        const response = await fetch(`${API_BASE_URL}/reminders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            credentials: 'include',
            body: JSON.stringify({ ...reminderData, userId })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error creating reminder:', error);
        // Fallback to local storage
        const reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
        const newReminder = {
            _id: String(Date.now()),
            ...reminderData,
            createdAt: new Date().toISOString(),
            active: true
        };
        reminders.push(newReminder);
        localStorage.setItem('reminders', JSON.stringify(reminders));
        return newReminder;
    }
}

export async function updateReminder(id, updates) {
    try {
        const response = await fetch(`${API_BASE_URL}/reminders/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            credentials: 'include',
            body: JSON.stringify(updates)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error updating reminder:', error);
        // Fallback to local storage
        const reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
        const index = reminders.findIndex(r => r._id === id);
        if (index !== -1) {
            reminders[index] = { ...reminders[index], ...updates };
            localStorage.setItem('reminders', JSON.stringify(reminders));
            return reminders[index];
        }
        throw error;
    }
}

export async function deleteReminder(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/reminders/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return true;
    } catch (error) {
        console.error('Error deleting reminder:', error);
        // Fallback to local storage
    const reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
    const filtered = reminders.filter(r => r._id !== id);
    localStorage.setItem('reminders', JSON.stringify(filtered));
        return true;
    }
}

export async function getUpcomingReminders(userId) {
    try {
        const response = await fetch(`${API_BASE_URL}/reminders/upcoming/${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching upcoming reminders:', error);
        // Fallback to local storage and filter upcoming
        const reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
        const now = new Date();
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);
        
        return reminders.filter(r => {
            const reminderTime = new Date(r.createdAt || r.nextOccurrence || Date.now());
            return r.active && reminderTime >= now && reminderTime <= endOfDay;
        });
    }
}

export async function completeReminder(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/reminders/${id}/complete`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error completing reminder:', error);
        // Fallback to local storage
        const reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
        const index = reminders.findIndex(r => r._id === id);
        if (index !== -1) {
            reminders[index].completed = true;
            reminders[index].active = false;
            localStorage.setItem('reminders', JSON.stringify(reminders));
            return reminders[index];
        }
        throw error;
    }
}