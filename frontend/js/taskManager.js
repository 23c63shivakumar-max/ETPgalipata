// Task Manager Service
const API_BASE_URL = 'http://localhost:5000/api';

export async function getUserTasks() {
    try {
        // Get the user ID from localStorage or session
        const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
        if (!userId) {
            console.warn('No user ID found. Using default task storage.');
            return JSON.parse(localStorage.getItem('tasks') || '[]');
        }

        const response = await fetch(`${API_BASE_URL}/tasks`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching tasks:', error);
        throw error;
    }
}

export async function addTask(taskData) {
    try {
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Add Authorization header if you have authentication
                // 'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            credentials: 'include',
            body: JSON.stringify(taskData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error adding task:', error);
        throw error;
    }
}

export async function updateTask(taskId, updates) {
    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                // Add Authorization header if you have authentication
                // 'Authorization': `Bearer ${localStorage.getItem('token')}`
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
        console.error('Error updating task:', error);
        throw error;
    }
}

export async function deleteTask(taskId) {
    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                // Add Authorization header if you have authentication
                // 'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error deleting task:', error);
        throw error;
    }
}