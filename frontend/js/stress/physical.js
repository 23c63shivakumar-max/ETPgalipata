// physical.js — activity tracker
import { store, todayISO } from '../storage.js';

export function actSave(){ const type=document.getElementById('actType')?.value||'Walk'; const duration=Math.max(1, parseInt(document.getElementById('actDuration')?.value,10)||20); const intensity=document.getElementById('actIntensity')?.value||'moderate'; const log = store.get('actLog',[]); const entry = { date: todayISO(), activity:type, duration, intensity }; log.unshift(entry); store.set('actLog', log); renderActLog(); drawActChart(); }
export function renderActLog(){ const ul = document.getElementById('actLog'); if (!ul) return; ul.innerHTML=''; const log = store.get('actLog',[]); log.slice(0,30).forEach(a=>{ const li=document.createElement('li'); li.textContent = `${a.date} — ${a.activity} (${a.duration} min, ${a.intensity})`; ul.appendChild(li); }); }
export function drawActChart(){ const canvas=document.getElementById('actChart'); if (!canvas) return; const ctx=canvas.getContext('2d'); ctx.clearRect(0,0,canvas.width,canvas.height); const log = store.get('actLog',[]); const map = new Map(); for (let i=6;i>=0;i--){ const d=new Date(); d.setDate(d.getDate()-i); const key=d.toISOString().slice(0,10); map.set(key,0); }
  log.forEach(a=>{ if (map.has(a.date)) map.set(a.date, map.get(a.date)+a.duration); }); const labels=Array.from(map.keys()); const data=Array.from(map.values()); const max=Math.max(60,...data); const pad=40,w=canvas.width,h=canvas.height,chartW=w-pad*2,chartH=h-pad*2; ctx.strokeStyle='rgba(255,255,255,0.6)'; ctx.fillStyle='rgba(255,255,255,0.8)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(pad,pad); ctx.lineTo(pad,h-pad); ctx.lineTo(w-pad,h-pad); ctx.stroke(); const bw = chartW/labels.length*0.6; labels.forEach((lab,i)=>{ const x = pad + (i+0.2)*(chartW/labels.length); const bh = (data[i]/max)*(chartH*0.9); const y = h-pad-bh; ctx.fillRect(x,y,bw,bh); 
    ctx.save();
     ctx.fillStyle='rgba(255,255,255,0.7)'; 
     ctx.font='12px sans-serif'; 
     ctx.fillText(lab.slice(5), x, h-pad+14); 
     ctx.restore(); 
    });
 }