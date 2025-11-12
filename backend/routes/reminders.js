import express from 'express';
import mongoose from 'mongoose';
import Reminder from '../models/reminder.js';
import store from '../lib/reminderStore.js';

const router = express.Router();

// Get all reminders for a user
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { status, category } = req.query;

        const query = { user: userId };
        if (status) query.active = status === 'active';
        if (category) query.category = category;

        let reminders;
        const useDb = mongoose && mongoose.connection && mongoose.connection.readyState === 1;
        if (useDb) {
            reminders = await Reminder.find(query).sort({ nextOccurrence: 1 }).lean();
        } else {
            reminders = await store.getRemindersByUser(userId, { active: query.active });
        }

        res.json(reminders);
    } catch (error) {
        console.error('Error fetching reminders:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
});

// Create a new reminder
router.post('/', async (req, res) => {
    try {
        const { text, time, priority, repeat, category, userId } = req.body;

        // Validate required fields
        if (!text || !time || !userId) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'Text, time, and userId are required'
            });
        }

        // Calculate next occurrence
        const now = new Date();
        const [hours, minutes] = time.split(':');
        const nextOccurrence = new Date(now);
        nextOccurrence.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        if (nextOccurrence < now) {
            nextOccurrence.setDate(nextOccurrence.getDate() + 1);
        }

        const payload = {
            user: userId,
            text,
            time,
            priority: priority || 'medium',
            repeat: repeat || 'none',
            category: category || 'general',
            nextOccurrence
        };
        const useDb = mongoose && mongoose.connection && mongoose.connection.readyState === 1;
        let created;
        if (useDb) {
            const reminder = new Reminder(payload);
            await reminder.save();
            created = reminder;
        } else {
            created = await store.createReminder(payload);
        }
        res.status(201).json(created);
    } catch (error) {
        console.error('Error creating reminder:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
});

// Update a reminder
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Calculate new nextOccurrence if time is being updated
        if (updates.time) {
            const [hours, minutes] = updates.time.split(':');
            const nextOccurrence = new Date();
            nextOccurrence.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            if (nextOccurrence < new Date()) {
                nextOccurrence.setDate(nextOccurrence.getDate() + 1);
            }
            updates.nextOccurrence = nextOccurrence;
        }

        const useDb = mongoose && mongoose.connection && mongoose.connection.readyState === 1;
        let updated;
        if (useDb) {
            updated = await Reminder.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true });
        } else {
            updated = await store.updateReminder(id, updates);
        }
        if (!updated) {
            return res.status(404).json({ error: 'Not found', message: 'Reminder not found' });
        }
        res.json(updated);
    } catch (error) {
        console.error('Error updating reminder:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
});

// Delete a reminder
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const useDb = mongoose && mongoose.connection && mongoose.connection.readyState === 1;
        if (useDb) {
            const reminder = await Reminder.findByIdAndDelete(id);
            if (!reminder) return res.status(404).json({ error: 'Not found', message: 'Reminder not found' });
            return res.json({ message: 'Reminder deleted successfully' });
        }
        await store.deleteReminder(id);
        res.json({ message: 'Reminder deleted successfully' });
    } catch (error) {
        console.error('Error deleting reminder:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
});

// Get upcoming reminders
router.get('/upcoming/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const now = new Date();
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);

        const useDb = mongoose && mongoose.connection && mongoose.connection.readyState === 1;
        let reminders;
        if (useDb) {
            reminders = await Reminder.find({ user: userId, active: true, nextOccurrence: { $gte: now, $lte: endOfDay } }).sort({ nextOccurrence: 1 });
        } else {
            reminders = await store.getUpcomingReminders(userId);
        }
        res.json(reminders);
    } catch (error) {
        console.error('Error fetching upcoming reminders:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
});

// Mark reminder as completed
router.patch('/:id/complete', async (req, res) => {
    try {
        const { id } = req.params;
        const useDb = mongoose && mongoose.connection && mongoose.connection.readyState === 1;
        if (useDb) {
            const reminder = await Reminder.findById(id);
            if (!reminder) return res.status(404).json({ error: 'Not found', message: 'Reminder not found' });
            reminder.completed = true;
            if (reminder.repeat !== 'none') {
                const nextOccurrence = new Date(reminder.nextOccurrence);
                switch (reminder.repeat) {
                    case 'daily': nextOccurrence.setDate(nextOccurrence.getDate() + 1); break;
                    case 'weekly': nextOccurrence.setDate(nextOccurrence.getDate() + 7); break;
                    case 'monthly': nextOccurrence.setMonth(nextOccurrence.getMonth() + 1); break;
                }
                reminder.nextOccurrence = nextOccurrence;
                reminder.completed = false;
            } else {
                reminder.active = false;
            }
            await reminder.save();
            return res.json(reminder);
        }
        // File-store flow
        const rem = await store.findReminderById(id);
        if (!rem) return res.status(404).json({ error: 'Not found', message: 'Reminder not found' });
        rem.completed = true;
        if (rem.repeat && rem.repeat !== 'none') {
            const nextOccurrence = new Date(rem.nextOccurrence || rem.createdAt);
            switch (rem.repeat) {
                case 'daily': nextOccurrence.setDate(nextOccurrence.getDate() + 1); break;
                case 'weekly': nextOccurrence.setDate(nextOccurrence.getDate() + 7); break;
                case 'monthly': nextOccurrence.setMonth(nextOccurrence.getMonth() + 1); break;
            }
            rem.nextOccurrence = nextOccurrence;
            rem.completed = false;
        } else {
            rem.active = false;
        }
        await store.updateReminder(id, rem);
        res.json(rem);
    } catch (error) {
        console.error('Error completing reminder:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
});

export default router;