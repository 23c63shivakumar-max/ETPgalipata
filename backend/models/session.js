import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['breathing', 'pmr', 'journaling', 'mindfulness', 'physical']
  },
  duration: {
    type: Number,  // duration in minutes
    required: true
  },
  completed: {
    type: Boolean,
    default: true
  },
  notes: String,
  mood: String,
  date: {
    type: Date,
    default: Date.now
  },
  metrics: {
    relaxationScore: Number,    // 1-5 scale for PMR
    breathPattern: String,      // for breathing exercises
    mindfulnessType: String,    // for mindfulness sessions
    activityType: String,       // for physical activity
    intensity: String          // for physical activity
  }
});

export default mongoose.model("Session", sessionSchema);