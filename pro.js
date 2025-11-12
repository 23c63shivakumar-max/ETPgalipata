// ===============================
// Student Stress Management Portal
// Cleaned & Optimized pro.js
// ===============================

// ---------- GLOBAL UTILITIES ----------
const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const load = (k, def) => JSON.parse(localStorage.getItem(k)) || def;

// ---------- PAGE NAVIGATION ----------
function showPage(pageId) {
  $$("main section").forEach(sec => sec.classList.add("hidden"));
  $("#" + pageId)?.classList.remove("hidden");
  $$(".topnav button").forEach(b => b.classList.remove("active"));
  document.querySelector(`.topnav button[onclick="showPage('${pageId}')"]`)?.classList.add("active");
}

function toggleSidebar() {
  $("#sidebar")?.classList.toggle("hidden");
}

// ---------- LOGIN ----------
function login() {
  const email = $("#loginEmail").value.trim();
  const pass = $("#loginPassword").value.trim();
  if (!email || !pass) return alert("Please enter both email and password.");
  $("#studentEmail").textContent = email;
  showPage("homePage");
  alert("Welcome " + email);
}

// ---------- CONTACT ----------
function sendContact() {
  const msg = $("#contactMessage").value.trim();
  if (!msg) return alert("Please type your message.");
  alert("Message sent. Our support team will reach out soon!");
  $("#contactMessage").value = "";
}

// ---------- PROFILE ----------
function editProfile() {
  const name = prompt("Enter your name:", $("#studentName").textContent);
  if (name) $("#studentName").textContent = name;
}

// ---------- STRESS MANAGEMENT TABS ----------
$$(".strategy-tab").forEach(tab => {
  tab.addEventListener("click", e => {
    $$(".strategy-tab").forEach(t => t.classList.remove("active"));
    e.target.classList.add("active");
    const tgt = e.target.dataset.target;
    $$(".strategy-panel").forEach(p => p.classList.remove("show"));
    $("#panel-" + tgt)?.classList.add("show");
  });
});

// ---------- 1) DEEP BREATHING ----------
let breathTimer, breathSec = 0, breathRunning = false;
const breathTime = $("#breathTime"), breathProgress = $("#breathProgress");

$("#breathStart")?.addEventListener("click", () => {
  if (breathRunning) return;
  breathRunning = true;
  breathTimer = setInterval(() => {
    breathSec++;
    const m = String(Math.floor(breathSec / 60)).padStart(2, "0");
    const s = String(breathSec % 60).padStart(2, "0");
    breathTime.textContent = `${m}:${s}`;
    breathProgress.style.width = (breathSec % 60) * 1.6 + "%";
  }, 1000);
});

$("#breathPause")?.addEventListener("click", () => {
  clearInterval(breathTimer);
  breathRunning = false;
});

$("#breathReset")?.addEventListener("click", () => {
  clearInterval(breathTimer);
  breathSec = 0;
  breathRunning = false;
  breathTime.textContent = "00:00";
  breathProgress.style.width = "0%";
});

$("#breathSave")?.addEventListener("click", () => {
  const logs = load("breathLogs", []);
  const now = new Date().toLocaleString();
  logs.push(`Session completed at ${now}`);
  save("breathLogs", logs);
  renderLog("breathLog", logs);
});

function renderLog(id, data) {
  const ul = $("#" + id);
  if (!ul) return;
  ul.innerHTML = data.map(i => `<li>${i}</li>`).join("");
}
renderLog("breathLog", load("breathLogs", []));

// ---------- 2) PROGRESSIVE MUSCLE RELAXATION ----------
let pmrIndex = 0;
const pmrSteps = [
  "Feet & Calves","Thighs","Glutes & Hips","Stomach & Lower Back","Chest & Upper Back",
  "Hands & Forearms","Upper Arms & Shoulders","Neck & Jaw","Eyes & Forehead"
];
function showPMRStep() {
  $("#pmrSteps")?.scrollIntoView({ behavior: "smooth" });
  $$("#pmrSteps li").forEach((li, i) => {
    li.style.color = i === pmrIndex ? "#00bcd4" : "";
  });
}
$("#pmrPrev")?.addEventListener("click", () => { if (pmrIndex > 0) pmrIndex--; showPMRStep(); });
$("#pmrNext")?.addEventListener("click", () => { if (pmrIndex < pmrSteps.length - 1) pmrIndex++; showPMRStep(); });
$("#pmrSave")?.addEventListener("click", () => {
  const val = $("#pmrRelax").value;
  const notes = $("#pmrNotes").value;
  const logs = load("pmrLogs", []);
  logs.push(`Relax Level ${val}/5 - ${notes}`);
  save("pmrLogs", logs);
  renderLog("pmrLog", logs);
  $("#pmrNotes").value = "";
});
renderLog("pmrLog", load("pmrLogs", []));

// ---------- 3) JOURNALING ----------
$("#journalSave")?.addEventListener("click", () => {
  const text = $("#journalText").value.trim();
  if (!text) return alert("Please write something.");
  const mood = $("#journalMood").value;
  const prompt = $("#journalPrompt").value;
  const now = new Date().toLocaleString();
  const logs = load("journalLogs", []);
  logs.push(`${now} - ${prompt} ${mood}: ${text}`);
  save("journalLogs", logs);
  renderLog("journalLog", logs);
  $("#journalText").value = "";
});
$("#journalClear")?.addEventListener("click", () => $("#journalText").value = "");
renderLog("journalLog", load("journalLogs", []));

// ---------- 4) MINDFULNESS ----------
let mindTimer, mindSec = 0, mindRun = false;
const mindTime = $("#mindTime"), mindProgress = $("#mindProgress");

$("#mindStart")?.addEventListener("click", () => {
  if (mindRun) return;
  mindRun = true;
  mindTimer = setInterval(() => {
    mindSec++;
    const m = String(Math.floor(mindSec / 60)).padStart(2, "0");
    const s = String(mindSec % 60).padStart(2, "0");
    mindTime.textContent = `${m}:${s}`;
    mindProgress.style.width = (mindSec % 60) * 1.6 + "%";
  }, 1000);
});
$("#mindPause")?.addEventListener("click", () => { clearInterval(mindTimer); mindRun = false; });
$("#mindReset")?.addEventListener("click", () => {
  clearInterval(mindTimer); mindSec = 0; mindRun = false;
  mindTime.textContent = "00:00"; mindProgress.style.width = "0%";
});
$("#mindBookmark")?.addEventListener("click", () => {
  const type = $("#mindType").value;
  const logs = load("mindBookmarks", []);
  logs.push(`Bookmarked session: ${type}`);
  save("mindBookmarks", logs);
  renderLog("mindBookmarks", logs);
});
renderLog("mindBookmarks", load("mindBookmarks", []));
renderLog("mindLog", load("mindLogs", []));

// ---------- 5) PHYSICAL ACTIVITY ----------
$("#actSave")?.addEventListener("click", () => {
  const type = $("#actType").value, dur = $("#actDuration").value, inten = $("#actIntensity").value;
  const logs = load("actLogs", []);
  logs.push(`${new Date().toLocaleTimeString()} - ${type}, ${dur} min, ${inten}`);
  save("actLogs", logs);
  renderLog("actLog", logs);
});
renderLog("actLog", load("actLogs", []));

// ---------- 6) POMODORO TIMER ----------
let pomTimer, pomTime = 25 * 60, pomRunning = false, pomFocus = true;
const pomClock = $("#pomClock"), pomLabel = $("#pomLabel");

function updatePomClock() {
  const m = String(Math.floor(pomTime / 60)).padStart(2, "0");
  const s = String(pomTime % 60).padStart(2, "0");
  pomClock.textContent = `${m}:${s}`;
}
$("#pomStart")?.addEventListener("click", () => {
  if (pomRunning) return;
  pomRunning = true;
  pomTimer = setInterval(() => {
    pomTime--;
    updatePomClock();
    if (pomTime <= 0) {
      clearInterval(pomTimer);
      pomRunning = false;
      pomFocus = !pomFocus;
      pomTime = pomFocus ? 25 * 60 : 5 * 60;
      pomLabel.textContent = pomFocus ? "Focus" : "Break";
      if ($("#pomSound").checked) new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg").play();
      const done = load("tmDone", 0) + (pomFocus ? 1 : 0);
      save("tmDone", done);
      $("#tmDone").textContent = done;
    }
  }, 1000);
});
$("#pomPause")?.addEventListener("click", () => { clearInterval(pomTimer); pomRunning = false; });
$("#pomReset")?.addEventListener("click", () => {
  clearInterval(pomTimer); pomRunning = false; pomTime = 25 * 60;
  pomFocus = true; pomLabel.textContent = "Focus"; updatePomClock();
});
updatePomClock();
$("#tmDone").textContent = load("tmDone", 0);

// ---------- 7) REMINDERS ----------
$("#addReminderBtn")?.addEventListener("click", () => {
  const text = $("#reminderText").value.trim(), time = $("#reminderTime").value;
  if (!text || !time) return alert("Enter reminder and time.");
  const list = load("reminders", []);
  list.push({ text, time, done: false });
  save("reminders", list);
  renderReminders();
  $("#reminderText").value = ""; $("#reminderTime").value = "";
});
function renderReminders() {
  const list = load("reminders", []);
  const container = $("#reminderList");
  if (!container) return;
  container.innerHTML = list.map((r, i) => `
    <div class="rem-row">
      <div>${r.text}</div>
      <div>${r.time}</div>
      <div>${r.done ? "✅" : "⏳"}</div>
      <div><button onclick="deleteReminder(${i})">🗑️</button></div>
    </div>
  `).join("");
}
function deleteReminder(i) {
  const list = load("reminders", []);
  list.splice(i, 1);
  save("reminders", list);
  renderReminders();
}
renderReminders();

// ---------- 8) TASK MANAGER ----------
$("#addTaskBtn")?.addEventListener("click", () => {
  const text = $("#taskInput").value.trim();
  if (!text) return;
  const tasks = load("tasks", []);
  tasks.push({ text, done: false });
  save("tasks", tasks);
  renderTasks();
  $("#taskInput").value = "";
});
function renderTasks() {
  const tasks = load("tasks", []);
  const ul = $("#taskList");
  ul.innerHTML = tasks.map((t, i) =>
    `<li><input type="checkbox" ${t.done ? "checked" : ""} onchange="toggleTask(${i})"> ${t.text}</li>`
  ).join("");
}
function toggleTask(i) {
  const tasks = load("tasks", []);
  tasks[i].done = !tasks[i].done;
  save("tasks", tasks);
  renderTasks();
}
renderTasks();

// ---------- 9) GAMES ----------
let points = load("points", 0);
$("#points").textContent = points;
$("#pointsProfile").textContent = points;

function earnPoints() {
  points += 10;
  save("points", points);
  $("#points").textContent = points;
  $("#pointsProfile").textContent = points;
}

// Calm Click
let calmLast = 0, calmScore = 0;
$("#calmButton")?.addEventListener("click", () => {
  const now = Date.now();
  if (calmLast && now - calmLast < 700) {
    calmScore = Math.max(0, calmScore - 1);
    $("#clickFeedback").textContent = "Too fast 😅";
  } else {
    calmScore++;
    $("#clickFeedback").textContent = "Calm click 🧘";
  }
  calmLast = now;
  $("#calmPoints").textContent = calmScore;
});

// Bubble Pop
const bubbleContainer = $("#bubbleContainer");
let bubbleScore = 0;
function spawnBubble() {
  const b = document.createElement("div");
  b.className = "bubbleItem";
  b.style.left = Math.random() * 90 + "%";
  b.style.top = Math.random() * 80 + "%";
  b.textContent = "🫧";
  b.onclick = () => {
    bubbleScore++;
    $("#bubblePoints").textContent = bubbleScore;
    b.remove();
  };
  bubbleContainer.appendChild(b);
  setTimeout(() => b.remove(), 4000);
}
setInterval(spawnBubble, 1500);

// Color Game
let colorTimer, colorRunning = false;
$("#startColorGame")?.addEventListener("click", () => {
  const circle = $("#colorCircle");
  if (colorRunning) return;
  colorRunning = true;
  let toggle = false;
  colorTimer = setInterval(() => {
    circle.style.background = toggle ? "blue" : "purple";
    toggle = !toggle;
  }, 2000);
});

// ---------- INITIAL LOAD ----------
document.addEventListener("DOMContentLoaded", () => showPage("homePage"));
