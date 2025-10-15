const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI).then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ MongoDB Error:", err));

// Routes
const authRoutes = require('./routes/auth');
const  postRoutes=require('./routes/posts.js')
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('🚀 Stress Management Backend is Running');
});

// Start server

