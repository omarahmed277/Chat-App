const express = require('express');
const router = express.Router();
const { signup, login, checkAuth } = require('../controllers/authController');

router.post('/signup', signup);
router.post('/login', login);
router.get('/check', checkAuth);

module.exports = router;