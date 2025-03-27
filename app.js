const express = require('express');
const dotenv = require('dotenv').config();
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const passport = require('passport');

const authRoutes = require('./routes/authRoutes');
const socialAuthRoutes = require('./routes/socialAuthRoutes');
const homeRoutes = require('./routes/homeRoutes');
const userRoutes = require('./routes/userRoutes');
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');
const logger = require('./middlewares/loggerMiddleware');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(bodyParser.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
  },
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(logger);

// Routes
app.use('/auth', authRoutes);
app.use('/auth', socialAuthRoutes);
app.use('/', homeRoutes);
app.use('/users', userRoutes);
// app.use('/api/appointments', require('./routes/appointmentRoutes')); // Assuming this exists

// Error Handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;