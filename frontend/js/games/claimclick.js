// calmclick.js — calm click game
export function initCalmClick(){
  const calmButton = document.getElementById('calmButton');
  if (!calmButton) return;
  const calmPointsDisplay = document.getElementById('calmPoints');
  const clickFeedback = document.getElementById('clickFeedback');
  let calmPoints = 0; let lastClickTime = 0;
  calmButton.addEventListener('click', ()=>{
    const now = Date.now(); const diff = now - lastClickTime; lastClickTime = now;
    if (diff < 1500 && diff > 0){ calmPoints = Math.max(0, calmPoints-1); clickFeedback.textContent='Too fast 😬 — try slower!'; clickFeedback.style.color='red'; }
    else if (diff >= 1500){ calmPoints++; clickFeedback.textContent='Nice & calm 🌿'; clickFeedback.style.color='lightgreen'; }
    else if (diff === 0){ clickFeedback.textContent='Start clicking calmly...'; clickFeedback.style.color='#fff'; }
    calmPointsDisplay && (calmPointsDisplay.textContent = calmPoints);
  });
}