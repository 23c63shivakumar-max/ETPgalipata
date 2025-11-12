import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import Reminder from '../models/reminder.js';

const DATA_DIR = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'data');
const FILE = path.join(DATA_DIR, 'reminders.json');

async function ensureDataFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try { await fs.access(FILE); } catch (e) { await fs.writeFile(FILE, '[]'); }
  } catch (err) {
    console.error('Failed to ensure data file:', err);
  }
}

function isDbConnected() {
  return mongoose && mongoose.connection && mongoose.connection.readyState === 1;
}

async function readFileStore() {
  await ensureDataFile();
  const raw = await fs.readFile(FILE, 'utf8');
  return JSON.parse(raw || '[]');
}

async function writeFileStore(list) {
  await ensureDataFile();
  await fs.writeFile(FILE, JSON.stringify(list, null, 2));
}

export async function getRemindersByUser(userId, query = {}) {
  if (isDbConnected()) {
    const q = { user: userId };
    if (query.active !== undefined) q.active = query.active;
    return Reminder.find(q).sort({ nextOccurrence: 1 }).lean();
  }
  const list = await readFileStore();
  return list.filter(r => String(r.user) === String(userId));
}

export async function createReminder(data) {
  if (isDbConnected()) {
    const rem = new Reminder(data);
    await rem.save();
    return rem.toObject();
  }
  const list = await readFileStore();
  const _id = String(Date.now());
  const now = new Date();
  const nextOccurrence = data.nextOccurrence || now.toISOString();
  const rem = { _id, ...data, nextOccurrence, createdAt: now.toISOString(), updatedAt: now.toISOString() };
  list.push(rem);
  await writeFileStore(list);
  return rem;
}

export async function updateReminder(id, updates) {
  if (isDbConnected()) {
    const rem = await Reminder.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true }).lean();
    return rem;
  }
  const list = await readFileStore();
  const idx = list.findIndex(r => String(r._id) === String(id));
  if (idx === -1) return null;
  list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
  await writeFileStore(list);
  return list[idx];
}

export async function deleteReminder(id) {
  if (isDbConnected()) {
    return Reminder.findByIdAndDelete(id);
  }
  const list = await readFileStore();
  const filtered = list.filter(r => String(r._id) !== String(id));
  await writeFileStore(filtered);
  return true;
}

export async function findReminderById(id) {
  if (isDbConnected()) {
    return Reminder.findById(id).lean();
  }
  const list = await readFileStore();
  return list.find(r => String(r._id) === String(id)) || null;
}

export async function getUpcomingReminders(userId) {
  if (isDbConnected()) {
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    return Reminder.find({ user: userId, active: true, nextOccurrence: { $gte: now, $lte: endOfDay } }).sort({ nextOccurrence: 1 }).lean();
  }
  const list = await readFileStore();
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  return list.filter(r => r.user == userId && r.active && new Date(r.nextOccurrence) >= now && new Date(r.nextOccurrence) <= endOfDay);
}

export default {
  getRemindersByUser,
  createReminder,
  updateReminder,
  deleteReminder,
  findReminderById,
  getUpcomingReminders
};
