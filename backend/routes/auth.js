import express from "express";
import bcrypt from "bcrypt";
import User from "../models/user.js";   // make sure the file name matches exactly

const router = express.Router();

// Validation middleware
const validateRegistration = (req, res, next) => {
  const { username, email, password } = req.body;
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }

  // Password validation
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  next();
};

// REGISTER USER
router.post("/register", validateRegistration, async (req, res) => {
  const { username, email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'User already exists' });

    const saltRounds = 10;
    const hashed = await bcrypt.hash(password, saltRounds);
    
    const newUser = new User({
      username,
      email,
      password: hashed,
      dateJoined: new Date(),
      profile: {
        points: 0,
        stressLevel: 5, // Default middle value
        preferences: {
          breathingPattern: '4-4-4', // Default pattern
          notifications: true,
          theme: 'light'
        }
      }
    });
    
    await newUser.save();
    return res.json({ 
      message: "✅ User registered successfully", 
      user: { 
        _id: newUser._id,
        username: newUser.username, 
        email: newUser.email,
        profile: newUser.profile
      } 
    });
  } catch (err) {
    console.error('Registration error', err);
    res.status(500).json({ error: "❌ Registration failed", details: err.message || err });
  }
});

// LOGIN USER
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "❌ Invalid email or password" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "❌ Invalid email or password" });

    // Update last login time
    user.lastLogin = new Date();
    await user.save();

    // Return safe user data
    const safeUser = {
      _id: user._id,
      username: user.username,
      email: user.email,
      profile: user.profile,
      dateJoined: user.dateJoined,
      lastLogin: user.lastLogin
    };
    return res.json({ message: "✅ Login successful", user: safeUser });
  }catch(err){
    console.error('Login error', err);
    res.status(500).json({ error: 'Login failed', details: err.message || err });
  }
});

export default router;
