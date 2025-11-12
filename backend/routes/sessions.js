import express from "express";
import Session from "../models/session.js";

const router = express.Router();

// Save a new session
router.post("/", async (req, res) => {
  try {
    const session = new Session({
      userId: req.body.userId,
      type: req.body.type,
      duration: req.body.duration,
      notes: req.body.notes,
      mood: req.body.mood,
      metrics: req.body.metrics
    });
    await session.save();
    res.json({ message: "Session saved successfully", session });
  } catch (err) {
    console.error("Session save error:", err);
    res.status(500).json({ error: "Failed to save session", details: err.message });
  }
});

// Get user's sessions
router.get("/user/:userId", async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.params.userId })
                                .sort({ date: -1 })
                                .limit(50);
    res.json(sessions);
  } catch (err) {
    console.error("Session fetch error:", err);
    res.status(500).json({ error: "Failed to fetch sessions", details: err.message });
  }
});

// Get sessions by type
router.get("/type/:type/user/:userId", async (req, res) => {
  try {
    const sessions = await Session.find({ 
      userId: req.params.userId,
      type: req.params.type 
    }).sort({ date: -1 });
    res.json(sessions);
  } catch (err) {
    console.error("Session fetch error:", err);
    res.status(500).json({ error: "Failed to fetch sessions", details: err.message });
  }
});

export default router;