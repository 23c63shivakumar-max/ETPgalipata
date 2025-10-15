const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Fake login for POC
  if (email && password) {
    const token = jwt.sign({ id: email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(400).json({ msg: 'Email and password are required' });
  }
});

module.exports = router;//routers auth.js
