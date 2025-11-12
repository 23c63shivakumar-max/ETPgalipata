export function initContact(){
  const sendBtn = document.getElementById('contactSend');
  if (sendBtn) sendBtn.addEventListener('click', sendContact);
}

export function sendContact(){
  const message = document.getElementById('contactMessage')?.value.trim();
  if (!message) return alert('Please write a message before sending.');
  // for demo store in localStorage or simply alert
  alert('Message sent successfully!');
  document.getElementById('contactMessage').value = '';
}
