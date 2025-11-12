import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const reminderSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true },
    time: { type: String, required: true }, // stored as HH:MM
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    repeat: { type: String, enum: ['none', 'daily', 'weekly', 'monthly'], default: 'none' },
    category: { type: String, default: 'general' },
    nextOccurrence: { type: Date },
    active: { type: Boolean, default: true },
    completed: { type: Boolean, default: false }
}, { timestamps: true });

// Compute nextOccurrence before save if missing
reminderSchema.pre('save', function (next) {
    if (!this.nextOccurrence && this.time) {
        const now = new Date();
        const parts = this.time.split(':');
        const nextDate = new Date(now);
        nextDate.setHours(parseInt(parts[0] || 0, 10), parseInt(parts[1] || 0, 10), 0, 0);
        if (nextDate <= now) nextDate.setDate(nextDate.getDate() + 1);
        this.nextOccurrence = nextDate;
    }
    next();
});

// Index for efficient querying
reminderSchema.index({ user: 1, active: 1, nextOccurrence: 1 });

export default model('Reminder', reminderSchema);