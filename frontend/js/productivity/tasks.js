// tasks.js — task manager (DB-primary, localStorage fallback for offline)
import { store } from '../../js/storage.js';

const API_URL = 'http://localhost:5000/api';

// Get tasks from backend API
async function getBackendTasks() {
	try {
		const userId = store.get('userId') || localStorage.getItem('userId');
		if (!userId) {
			console.warn('No userId found, cannot fetch tasks');
			return [];
		}
		
		const response = await fetch(`${API_URL}/tasks/user/${userId}`, {
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include'
		});
		
		if (!response.ok) {
			console.warn('Failed to fetch tasks from backend:', response.status);
			return [];
		}
		
		return await response.json();
	} catch (err) {
		console.warn('Error fetching tasks from backend, will use localStorage fallback:', err);
		return JSON.parse(localStorage.getItem('tasks')) || [];
	}
}

// Render tasks into the three-column UI if present, otherwise fall back to a simple list `taskList`.
export async function tmShowTasks() {
	const todoEl = document.getElementById('todoList');
	const inProgressEl = document.getElementById('inProgressList');
	const doneEl = document.getElementById('doneList');
	const simpleList = document.getElementById('taskList');

	// Fetch from backend
	let tasks = await getBackendTasks();

	if (todoEl && inProgressEl && doneEl) {
		todoEl.innerHTML = '';
		inProgressEl.innerHTML = '';
		doneEl.innerHTML = '';

		tasks.forEach((task) => {
			const li = document.createElement('li');
			li.textContent = task.title || task.text;
			li.draggable = true;
			li.dataset.taskId = task._id;

			const btnRow = document.createElement('div');
			btnRow.className = 'task-actions-inline';

			const completeBtn = document.createElement('button');
			completeBtn.textContent = task.completed ? '✔' : '◻';
			completeBtn.onclick = () => tmToggleTask(task._id);
			btnRow.appendChild(completeBtn);

			const delBtn = document.createElement('button');
			delBtn.textContent = '🗑';
			delBtn.onclick = () => tmDeleteTask(task._id);
			btnRow.appendChild(delBtn);

			li.appendChild(btnRow);

			if (task.completed) doneEl.appendChild(li);
			else todoEl.appendChild(li);
		});
	} else if (simpleList) {
		simpleList.innerHTML = '';
		tasks.forEach((task) => {
			const li = document.createElement('li');
			const checkbox = document.createElement('input');
			checkbox.type = 'checkbox';
			checkbox.checked = task.completed;
			checkbox.onchange = () => tmToggleTask(task._id);
			const span = document.createElement('span');
			span.textContent = ' ' + (task.title || task.text);
			span.style.textDecoration = task.completed ? 'line-through' : 'none';
			const delBtn = document.createElement('button');
			delBtn.textContent = '❌';
			delBtn.onclick = () => tmDeleteTask(task._id);
			li.appendChild(checkbox);
			li.appendChild(span);
			li.appendChild(delBtn);
			li.dataset.taskId = task._id;
			simpleList.appendChild(li);
		});
	}
}

// Create a task in backend (primary) with localStorage fallback for offline
export async function tmAddTask() {
	const input = document.getElementById('taskInput');
	const taskText = (input?.value || '').trim();
	if (!taskText) { alert('Please enter a task!'); return; }

	try {
		const userId = store.get('userId') || localStorage.getItem('userId');
		if (!userId) {
			alert('Please log in first');
			return;
		}

		// POST to backend
		const payload = { title: taskText, description: '', userId };
		const resp = await fetch(`${API_URL}/tasks`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify(payload)
		});

		if (!resp.ok) {
			const errData = await resp.json();
			throw new Error(errData.error || 'Failed to create task');
		}

		const created = await resp.json();
		input.value = '';

		// Reload tasks from backend and re-render
		await tmShowTasks();
	} catch (err) {
		console.error('Error creating task:', err);
		alert('Failed to create task: ' + err.message);
	}
}

export async function tmToggleTask(taskId) {
	try {
		if (!taskId) {
			console.warn('No taskId provided');
			return;
		}

		// GET current task to toggle completion
		const tasks = await getBackendTasks();
		const task = tasks.find(t => t._id === taskId);
		if (!task) {
			console.warn('Task not found:', taskId);
			return;
		}

		// UPDATE on backend
		const resp = await fetch(`${API_URL}/tasks/${taskId}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify({ completed: !task.completed })
		});

		if (!resp.ok) {
			throw new Error('Failed to update task');
		}

		// Reload and re-render
		await tmShowTasks();
	} catch (err) {
		console.error('Error toggling task:', err);
		alert('Failed to update task');
	}
}

export async function tmDeleteTask(taskId) {
	try {
		if (!taskId) {
			console.warn('No taskId provided');
			return;
		}

		// DELETE from backend
		const resp = await fetch(`${API_URL}/tasks/${taskId}`, {
			method: 'DELETE',
			credentials: 'include'
		});

		if (!resp.ok) {
			throw new Error('Failed to delete task');
		}

		// Reload and re-render
		await tmShowTasks();
	} catch (err) {
		console.error('Error deleting task:', err);
		alert('Failed to delete task');
	}
}
