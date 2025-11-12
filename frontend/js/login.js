import { store } from './storage.js';

export function initLogin(){
  // Login handling
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) loginBtn.addEventListener('click', handleLogin);

  // Registration handling
  const registerBtn = document.getElementById('registerBtn');
  if (registerBtn) registerBtn.addEventListener('click', handleRegister);

  // Navigation between login/register pages
  const showRegisterBtn = document.getElementById('showRegisterBtn');
  const showLoginBtn = document.getElementById('showLoginBtn');
  if (showRegisterBtn) showRegisterBtn.addEventListener('click', e => {
    e.preventDefault();
    showPage('registerPage');
  });
  if (showLoginBtn) showLoginBtn.addEventListener('click', e => {
    e.preventDefault();
    showPage('loginPage');
  });

  // Profile editing
  const editBtn = document.getElementById('editProfileBtn');
  if (editBtn) editBtn.addEventListener('click', editProfile);

  // Populate profile if saved
  const email = store.get('studentEmail');
  if (email) document.getElementById('studentEmail') && (document.getElementById('studentEmail').textContent = email);
}

export async function handleLogin(e){
  const email = document.getElementById('loginEmail')?.value.trim();
  const password = document.getElementById('loginPassword')?.value.trim();
  if (!email || !password) { alert('Please enter both email and password.'); return; }

  try{
    const resp = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',   
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await resp.json();
    if (!resp.ok){ alert(data.error || 'Login failed'); return; }

    const user = data.user || {};
    store.set('studentEmail', user.email || email);
    store.set('userId', user._id); // Store user ID for session tracking
    if (user.username) store.set('studentName', user.username);
    document.getElementById('studentEmail') && (document.getElementById('studentEmail').textContent = user.email || email);
    document.getElementById('studentName') && (document.getElementById('studentName').textContent = user.username || document.getElementById('studentName').textContent);

    alert(data.message || 'Login successful!');
    const home = document.getElementById('homePage'); if (home) showPage('homePage');
  }catch(err){
    console.error('Login error', err);
    alert('Network error: could not reach server.');
  }
}

export function editProfile(){
  const newName = prompt('Enter your new name:');
  if (!newName) return;
  document.getElementById('studentName') && (document.getElementById('studentName').textContent = newName);
  store.set('studentName', newName);
  alert('Profile updated successfully!');
}

// helper: simple cross-file showPage fallback
export function showPage(id){
  document.querySelectorAll('main section').forEach(sec => sec.classList.add('hidden'));
  const el = document.getElementById(id); if (el) el.classList.remove('hidden');
}

export async function handleRegister(e){
  const username = document.getElementById('registerName')?.value.trim();
  const email = document.getElementById('registerEmail')?.value.trim();
  const password = document.getElementById('registerPassword')?.value.trim();
  const confirm = document.getElementById('registerConfirm')?.value.trim();

  // Validation
  if (!email || !password){ 
    alert('Please enter both email and password to register.'); 
    return; 
  }
  if (password !== confirm) {
    alert('Passwords do not match');
    return;
  }
  if (password.length < 6) {
    alert('Password must be at least 6 characters long');
    return;
  }

  try {
    const resp = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    const data = await resp.json();
    if (!resp.ok){ 
      alert(data.error || 'Registration failed'); 
      return; 
    }
    alert(data.message || 'Registered successfully! You can now sign in.');
    showPage('loginPage'); // Switch to login page after successful registration
  } catch(err) {
    console.error('Register error', err);
    alert('Network error: could not reach server.');
  }
}