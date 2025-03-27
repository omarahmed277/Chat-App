const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/', (req, res) => res.sendFile(path.join(__dirname, '../views/index.html')));
router.get('/chat', (req, res) => res.sendFile(path.join(__dirname, '../views/chat.html')));
router.get('/login', (req, res) => res.sendFile(path.join(__dirname, '../views/login.html')));
router.get('/profile', (req, res) => {
  if (!req.isAuthenticated()) return res.redirect('/');
  res.sendFile(path.join(__dirname, '../views/profile.html'));
});

module.exports = router;