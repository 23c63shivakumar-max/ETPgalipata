import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  dueDate: {
    type: Date,
    required: true
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'in-progress'],
    default: 'pending'
  },
  reminders: [{
    time: {
      type: Date,
      required: true
    },
    notified: {
      type: Boolean,
      default: false
    }
  }],
  category: {
    type: String,
    enum: ['study', 'exercise', 'relaxation', 'social', 'other'],
    default: 'other'
  },
  pomodoroCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for quick lookups
taskSchema.index({ userId: 1, dueDate: 1 });
taskSchema.index({ userId: 1, status: 1 });

export default mongoose.model("Task", taskSchema);