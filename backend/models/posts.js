const mongoose = require('mongoose');//retydytytu

const postSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
}, {
  timestamps: true
});

module.exports = mongoose.model('Post', postSchema); //models postes.js
