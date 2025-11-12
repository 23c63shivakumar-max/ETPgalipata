// storage.js — shared localStorage helpers
export const store = {
  get(key, fallback = null){
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch(e){ return fallback; }
  },
  set(key, value){
    localStorage.setItem(key, JSON.stringify(value));
  },
  remove(key){ localStorage.removeItem(key); }
};

export const todayISO = () => new Date().toISOString().slice(0,10);
export const uid = (len=7) => Math.random().toString(36).slice(2,2+len);

export function safeJSONParse(raw, fallback){ try { return JSON.parse(raw); } catch(e){ return fallback; } }
