import express from "express";
import User from "../models/user.js";

const router = express.Router();

// Get user profile
router.get("/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password'); // Exclude password
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// Update user profile
router.put("/:userId", async (req, res) => {
  try {
    const { username, profile } = req.body;
    const updates = {
      ...(username && { username }),
      ...(profile && { profile })
    };

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { $set: updates },
      { new: true, select: '-password' }
    );

    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "Profile updated successfully", user });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Update stress level
router.put("/:userId/stress-level", async (req, res) => {
  try {
    const { stressLevel } = req.body;
    if (stressLevel < 1 || stressLevel > 10) {
      return res.status(400).json({ error: "Stress level must be between 1 and 10" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { $set: { "profile.stressLevel": stressLevel } },
      { new: true, select: '-password' }
    );

    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "Stress level updated", user });
  } catch (err) {
    console.error('Stress level update error:', err);
    res.status(500).json({ error: "Failed to update stress level" });
  }
});

// Update user points
router.put("/:userId/points", async (req, res) => {
  try {
    const { points } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { $inc: { "profile.points": points } },
      { new: true, select: '-password' }
    );

    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "Points updated", user });
  } catch (err) {
    console.error('Points update error:', err);
    res.status(500).json({ error: "Failed to update points" });
  }
});

// Update user preferences
router.put("/:userId/preferences", async (req, res) => {
  try {
    const { preferences } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { $set: { "profile.preferences": preferences } },
      { new: true, select: '-password' }
    );

    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "Preferences updated", user });
  } catch (err) {
    console.error('Preferences update error:', err);
    res.status(500).json({ error: "Failed to update preferences" });
  }
});

export default router;