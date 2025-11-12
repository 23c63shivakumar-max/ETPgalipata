// Time Management JavaScript
"use strict";

// Simple, robust TimeManager constructor with prototype methods
(function (global) {
	function TimeManager() {
		if (!(this instanceof TimeManager)) return new TimeManager();

		// State
		this.tasks = { todo: [], inProgress: [], done: [] };
		this.stats = {
			focusHours: 0,
			pomodorosCompleted: 0,
			tasksCompleted: 0,
			weeklyHours: 0,
			mostProductiveDay: '-',
			completionRate: 0
		};

		// Timer state
		this.pomodoroTimer = null;
		this.timeRemaining = 0;
		this.isBreak = false;

		// DOM references (populated in initDOM)
		this.taskInput = null;
		this.taskPriority = null;
		this.taskTime = null;
		this.addTaskBtn = null;
		this.todoList = null;
		this.inProgressList = null;
		this.doneList = null;

		this.pomClock = null;
		this.pomLabel = null;
		this.pomStart = null;
		this.pomPause = null;
		this.pomReset = null;
		this.pomSession = null;
		this.pomSound = null;
		this.timerProgress = null;

		this.focusTime = null;
		this.pomCount = null;
		this.tasksDone = null;
		this.weeklyFocus = null;
		this.productiveDay = null;
		this.completionRate = null;

		// Load persistent state if present
		try {
			var savedTasks = localStorage.getItem('tasks');
			if (savedTasks) this.tasks = JSON.parse(savedTasks);
		} catch (e) {
			console.error('Failed to load tasks', e);
		}
		try {
			var savedStats = localStorage.getItem('timeStats');
			if (savedStats) this.stats = JSON.parse(savedStats);
		} catch (e) {
			console.error('Failed to load stats', e);
		}

		// Initialize DOM when ready
		if (document.readyState === 'loading') {
			var self = this;
			document.addEventListener('DOMContentLoaded', function () {
				self.initDOM();
			});
		} else {
			this.initDOM();
		}
	}

	/* ------------------ Prototype methods ------------------ */

	TimeManager.prototype.initDOM = function () {
		// Query DOM elements; tolerate missing elements for pages without this module
		this.taskInput = document.getElementById('taskInput');
		this.taskPriority = document.getElementById('taskPriority');
		this.taskTime = document.getElementById('taskTime');
		this.addTaskBtn = document.getElementById('addTaskBtn');
		this.todoList = document.getElementById('todoList');
		this.inProgressList = document.getElementById('inProgressList');
		this.doneList = document.getElementById('doneList');

		this.pomClock = document.getElementById('pomClock');
		this.pomLabel = document.getElementById('pomLabel');
		this.pomStart = document.getElementById('pomStart');
		this.pomPause = document.getElementById('pomPause');
		this.pomReset = document.getElementById('pomReset');
		this.pomSession = document.getElementById('pomSession');
		this.pomSound = document.getElementById('pomSound');
		this.timerProgress = document.getElementById('timerProgress');

		this.focusTime = document.getElementById('focusTime');
		this.pomCount = document.getElementById('pomCount');
		this.tasksDone = document.getElementById('tasksDone');
		this.weeklyFocus = document.getElementById('weeklyFocus');
		this.productiveDay = document.getElementById('productiveDay');
		this.completionRate = document.getElementById('completionRate');

		this.initEventListeners();
		this.renderTasks();
		this.updateStats();
	};

	TimeManager.prototype.initEventListeners = function () {
		var self = this;

		if (this.addTaskBtn) this.addTaskBtn.addEventListener('click', function () { self.addTask(); });
		if (this.taskInput) this.taskInput.addEventListener('keypress', function (e) { if (e.key === 'Enter') self.addTask(); });

		if (this.pomStart) this.pomStart.addEventListener('click', function () { self.startPomodoro(); });
		if (this.pomPause) this.pomPause.addEventListener('click', function () { self.pausePomodoro(); });
		if (this.pomReset) this.pomReset.addEventListener('click', function () { self.resetPomodoro(); });
		if (this.pomSession) this.pomSession.addEventListener('change', function () { self.updatePomodoroTime(); });

		// Drag & drop initialization only if lists exist
		if (this.todoList && this.inProgressList && this.doneList) this.initializeDragAndDrop();
	};

	TimeManager.prototype.addTask = function () {
		if (!this.taskInput) return;
		var text = this.taskInput.value.trim();
		if (!text) return;

		var task = {
			id: Date.now(),
			text: text,
			priority: (this.taskPriority && this.taskPriority.value) || 'normal',
			time: (this.taskTime && this.taskTime.value) || null,
			created: new Date().toISOString()
		};

		this.tasks.todo.push(task);
		this.saveTasks();
		this.renderTasks();
		this.taskInput.value = '';
	};

	TimeManager.prototype.moveTask = function (taskId, fromList, toList) {
		if (!this.tasks[fromList]) return;
		var idx = this.tasks[fromList].findIndex(function (t) { return t.id === taskId; });
		if (idx === -1) return;

		var task = this.tasks[fromList][idx];
		this.tasks[fromList].splice(idx, 1);
		if (!this.tasks[toList]) this.tasks[toList] = [];
		this.tasks[toList].push(task);

		if (toList === 'done') {
			this.stats.tasksCompleted++;
			this.updateCompletionRate();
		}

		this.saveTasks();
		this.renderTasks();
		this.updateStats();
	};

	TimeManager.prototype.renderTasks = function () {
		var lists = { todo: this.todoList, inProgress: this.inProgressList, done: this.doneList };
		var self = this;

		Object.keys(lists).forEach(function (status) {
			var listEl = lists[status];
			if (!listEl) return;
			listEl.innerHTML = '';

			var arr = Array.isArray(self.tasks[status]) ? self.tasks[status] : [];
			arr.forEach(function (task) {
				var li = document.createElement('li');
				li.draggable = true;
				li.dataset.taskId = task.id;

				var content = document.createElement('div');
				content.className = 'task-content';
				var textSpan = document.createElement('span');
				textSpan.className = 'priority-' + (task.priority || 'normal');
				textSpan.textContent = task.text;
				content.appendChild(textSpan);

				if (task.time) {
					var timeSpan = document.createElement('span');
					timeSpan.className = 'task-time';
					timeSpan.textContent = task.time;
					content.appendChild(timeSpan);
				}

				var actions = document.createElement('div');
				actions.className = 'task-actions';

				if (status !== 'done') {
					var moveBtn = document.createElement('button');
					moveBtn.className = 'task-btn';
					moveBtn.textContent = status === 'todo' ? '▶' : '✓';
					moveBtn.addEventListener('click', function () {
						self.moveTask(task.id, status, status === 'todo' ? 'inProgress' : 'done');
					});
					actions.appendChild(moveBtn);
				} else {
					var deleteBtn = document.createElement('button');
					deleteBtn.className = 'task-btn delete';
					deleteBtn.textContent = '×';
					deleteBtn.addEventListener('click', function () { self.deleteTask(task.id, 'done'); });
					actions.appendChild(deleteBtn);
				}

				li.appendChild(content);
				li.appendChild(actions);

				li.addEventListener('dragstart', function (e) {
					e.dataTransfer.setData('text/plain', String(task.id));
				});

				listEl.appendChild(li);
			});
		});
	};

	TimeManager.prototype.deleteTask = function (taskId, list) {
		if (!this.tasks[list]) return;
		var idx = this.tasks[list].findIndex(function (t) { return t.id === taskId; });
		if (idx === -1) return;
		this.tasks[list].splice(idx, 1);
		this.saveTasks();
		this.renderTasks();
		this.updateStats();
	};

	/* ------------------ Pomodoro Related ------------------ */

	TimeManager.prototype.startPomodoro = function () {
		if (this.pomodoroTimer) return;
		var minutes = 25;
		if (this.pomSession && this.pomSession.value) minutes = parseInt(this.pomSession.value, 10) || minutes;
		this.timeRemaining = minutes * 60;
		this.updatePomodoroDisplay();
		var self = this;
		this.pomodoroTimer = setInterval(function () {
			self.timeRemaining--;
			self.updatePomodoroDisplay();
			if (self.timeRemaining <= 0) {
				self.completePomodoroSession();
			}
		}, 1000);

		if (this.pomStart) this.pomStart.classList.add('hidden');
		if (this.pomPause) this.pomPause.classList.remove('hidden');
	};

	TimeManager.prototype.pausePomodoro = function () {
		if (!this.pomodoroTimer) return;
		clearInterval(this.pomodoroTimer);
		this.pomodoroTimer = null;
		if (this.pomStart) this.pomStart.classList.remove('hidden');
		if (this.pomPause) this.pomPause.classList.add('hidden');
	};

	TimeManager.prototype.resetPomodoro = function () {
		this.pausePomodoro();
		var minutes = 25;
		if (this.pomSession && this.pomSession.value) minutes = parseInt(this.pomSession.value, 10) || minutes;
		this.timeRemaining = minutes * 60;
		this.updatePomodoroDisplay();
	};

	TimeManager.prototype.completePomodoroSession = function () {
		this.pausePomodoro();
		if (!this.isBreak) {
			this.stats.pomodorosCompleted++;
			if (this.pomSession && this.pomSession.value) {
				this.stats.focusHours += (parseInt(this.pomSession.value, 10) || 25) / 60;
			} else this.stats.focusHours += 25 / 60;
			this.updateStats();
		}
		if (this.pomSound && this.pomSound.checked) this.playNotificationSound();
		this.isBreak = !this.isBreak;
		this.timeRemaining = this.isBreak ? 300 : ((this.pomSession && parseInt(this.pomSession.value, 10)) || 25) * 60;
		if (this.pomLabel) this.pomLabel.textContent = this.isBreak ? 'Break' : 'Focus Time';
		this.updatePomodoroDisplay();
	};

	TimeManager.prototype.updatePomodoroDisplay = function () {
		if (!this.pomClock) return;
		var minutes = Math.floor(this.timeRemaining / 60);
		var seconds = this.timeRemaining % 60;
		this.pomClock.textContent = String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');

		// visual progress
		if (this.timerProgress) {
			var total = ((this.pomSession && parseInt(this.pomSession.value, 10)) || 25) * 60;
			var progress = total ? (1 - this.timeRemaining / total) * 360 : 0;
			this.timerProgress.style.transform = 'rotate(' + progress + 'deg)';
		}
	};

	TimeManager.prototype.updatePomodoroTime = function () {
		this.resetPomodoro();
	};

	TimeManager.prototype.playNotificationSound = function () {
		try {
			var audio = new Audio();
			// simple beep using WebAudio could be done, but keep previously embedded audio data out for brevity
			audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=';
			audio.play().catch(function () { /* ignore autoplay block */ });
		} catch (e) {
			// ignore
		}
	};

	/* ------------------ Stats & persistence ------------------ */

	TimeManager.prototype.updateStats = function () {
		if (this.focusTime) this.focusTime.textContent = (this.stats.focusHours || 0).toFixed(1);
		if (this.pomCount) this.pomCount.textContent = this.stats.pomodorosCompleted || 0;
		if (this.tasksDone) this.tasksDone.textContent = this.stats.tasksCompleted || 0;
		if (this.weeklyFocus) this.weeklyFocus.textContent = (this.stats.weeklyHours || 0).toFixed(1);
		if (this.productiveDay) this.productiveDay.textContent = this.stats.mostProductiveDay || '-';
		if (this.completionRate) this.completionRate.textContent = (this.stats.completionRate || 0) + '%';
		this.saveStats();
	};

	TimeManager.prototype.updateCompletionRate = function () {
		var total = (this.tasks.todo && this.tasks.todo.length || 0) + (this.tasks.inProgress && this.tasks.inProgress.length || 0) + (this.tasks.done && this.tasks.done.length || 0);
		this.stats.completionRate = total ? Math.round(((this.tasks.done && this.tasks.done.length) || 0) / total * 100) : 0;
	};

	TimeManager.prototype.initializeDragAndDrop = function () {
		var lists = [this.todoList, this.inProgressList, this.doneList];
		var self = this;
		lists.forEach(function (listEl) {
			if (!listEl) return;

			listEl.addEventListener('dragover', function (e) {
				e.preventDefault();
				// visual feedback optional
			});

			listEl.addEventListener('drop', function (e) {
				e.preventDefault();
				try {
					var id = parseInt(e.dataTransfer.getData('text/plain'), 10);
					var target = e.target.closest('.task-list');
					var targetListId = target ? target.id.replace(/List$/, '') : (listEl.id ? listEl.id.replace(/List$/, '') : null);
					if (!targetListId) return;

					// find source by searching lists for element
					var sourceListId = null;
					['todoList', 'inProgressList', 'doneList'].forEach(function (elId) {
						var el = document.getElementById(elId);
						if (el && el.querySelector('[data-task-id="' + id + '"]')) {
							sourceListId = elId.replace(/List$/, '');
						}
					});

					if (sourceListId && sourceListId !== targetListId) self.moveTask(id, sourceListId, targetListId);
				} catch (err) {
					// ignore
				}
			});
		});
	};

	TimeManager.prototype.saveTasks = function () {
		try { localStorage.setItem('tasks', JSON.stringify(this.tasks)); } catch (e) { /* ignore */ }
	};

	TimeManager.prototype.saveStats = function () {
		try { localStorage.setItem('timeStats', JSON.stringify(this.stats)); } catch (e) { /* ignore */ }
	};

	TimeManager.prototype.updateTimerProgress = function () {
		if (!this.timerProgress) return;
		var total = ((this.pomSession && parseInt(this.pomSession.value, 10)) || 25) * 60;
		var progress = total ? (1 - this.timeRemaining / total) * 360 : 0;
		this.timerProgress.style.setProperty('--progress', progress + 'deg');
	};

	// attach to global
	global.TimeManager = TimeManager;
	try { global.timeManager = new TimeManager(); } catch (e) { /* If constructor requires DOM and fails, it's ok to defer */ }

})(window);


