import express from "express";
import Task from "../models/task.js";

const router = express.Router();

// Create new task with reminders
router.post("/", async (req, res) => {
  try {
    // sanitize and normalize incoming payload
    const body = { ...req.body };
    // Trim accidental surrounding quotes around userId (some frontends store JSON-encoded strings)
    if (typeof body.userId === 'string') {
      body.userId = body.userId.replace(/^\"+|\"+$/g, '');
    }
    // Ensure dueDate exists (some UIs don't supply one) — default to now
    if (!body.dueDate) {
      body.dueDate = new Date();
    }

    const task = new Task({
      ...body,
      createdAt: new Date()
    });
    await task.save();
    // Populate any references if needed
    const savedTask = await Task.findById(task._id);
    res.json({ 
      message: "Task created successfully", 
      task: savedTask,
      _id: savedTask._id // Ensure _id is included for frontend reference
    });
  } catch (err) {
    console.error("Task creation error:", err);
    res.status(500).json({ error: "Failed to create task", details: err.message });
  }
});

// Get user's tasks
router.get("/user/:userId", async (req, res) => {
  try {
    const { status, category, dueDate } = req.query;
    const query = { userId: req.params.userId };
    
    if (status) query.status = status;
    if (category) query.category = category;
    if (dueDate) {
      const date = new Date(dueDate);
      query.dueDate = {
        $gte: new Date(date.setHours(0, 0, 0)),
        $lt: new Date(date.setHours(23, 59, 59))
      };
    }

    const tasks = await Task.find(query).sort({ dueDate: 1 });
    res.json(tasks);
  } catch (err) {
    console.error("Task fetch error:", err);
    res.status(500).json({ error: "Failed to fetch tasks", details: err.message });
  }
});

// Update task
router.put("/:taskId", async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.taskId,
      { $set: req.body },
      { new: true }
    );
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json({ message: "Task updated successfully", task });
  } catch (err) {
    console.error("Task update error:", err);
    res.status(500).json({ error: "Failed to update task", details: err.message });
  }
});

// Delete task
router.delete("/:taskId", async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    console.error("Task deletion error:", err);
    res.status(500).json({ error: "Failed to delete task", details: err.message });
  }
});

// Update pomodoro count
router.put("/:taskId/pomodoro", async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.taskId,
      { $inc: { pomodoroCount: 1 } },
      { new: true }
    );
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json({ message: "Pomodoro count updated", task });
  } catch (err) {
    console.error("Pomodoro update error:", err);
    res.status(500).json({ error: "Failed to update pomodoro count" });
  }
});

// Get upcoming reminders
router.get("/reminders/:userId", async (req, res) => {
  try {
    const now = new Date();
    const tasks = await Task.find({
      userId: req.params.userId,
      status: { $ne: 'completed' },
      'reminders.time': { $gte: now },
      'reminders.notified': false
    }).sort({ 'reminders.time': 1 });
    
    res.json(tasks);
  } catch (err) {
    console.error("Reminder fetch error:", err);
    res.status(500).json({ error: "Failed to fetch reminders" });
  }
});

export default router;