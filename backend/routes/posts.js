const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Post = require('../models/posts');

// Get posts
router.get('/', auth, async (req, res) => {
  const posts = await Post.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.json(posts);
});

// Create post
router.post('/', auth, async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ msg: 'Text required' });

  const newPost = new Post({ text, user: req.user.id });
  const post = await newPost.save();
  res.json(post);
});

module.exports = router;//routers postes.js
