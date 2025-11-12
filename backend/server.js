import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import sessionRoutes from "./routes/sessions.js";
import taskRoutes from "./routes/tasks.js";
import reminderRoutes from "./routes/reminders.js";

dotenv.config();

const app = express();
app.use(express.json());

// Configure CORS
app.use((req, res, next) => {
    // Allow both localhost and 127.0.0.1
    const origin = req.headers.origin;
    if (origin === 'http://localhost:5500' || origin === 'http://127.0.0.1:5500') {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    
    // Enable credentials
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Allow methods
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    
    // Allow headers
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    next();
});

// Global middleware for additional security headers
app.use((req, res, next) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// CONNECT TO MONGO
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

// API ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/reminders", reminderRoutes);

// Serve frontend static files for convenience (development)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPath = path.join(__dirname, "../frontend");
app.use(express.static(frontendPath));

// Fallback to index.html for SPA routes
// Use '/*' to avoid path-to-regexp parameter parsing issues with plain '*'
// Express path-to-regexp v6: use a named param with a wildcard pattern to match all SPA routes
// Use a regular expression route to match all remaining requests and return index.html
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
