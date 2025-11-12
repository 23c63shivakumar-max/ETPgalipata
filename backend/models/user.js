import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  dateJoined: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  },
  profile: {
    points: { type: Number, default: 0 },
    stressLevel: { type: Number, min: 1, max: 10 },
    preferences: {
      breathingPattern: String,
      notifications: { type: Boolean, default: true },
      theme: { type: String, default: 'light' }
    }
  },
  sessions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session'
  }]
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

// Add unique index for email
userSchema.index({ email: 1 }, { unique: true });

export default mongoose.model("User", userSchema);
