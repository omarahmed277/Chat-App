const express = require('express');
const router = express.Router();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const OpenIDConnectStrategy = require('passport-openidconnect').Strategy;
const { User } = require('../models/User');
const bcrypt = require('bcrypt');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:4000/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ $or: [{ googleId: profile.id }, { email: profile.emails[0].value }] });
        if (!user) {
          user = new User({
            name: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id,
            connections: [],
            pendingRequests: [],
            profileCompleted: false,
          });
          await user.save();
        } else if (!user.googleId) {
          user.googleId = profile.id;
          await user.save();
        }
        return done(null, { _id: user._id, email: user.email, name: user.name, googleId: user.googleId, profileCompleted: user.profileCompleted });
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.use(
  new OpenIDConnectStrategy(
    {
      issuer: 'https://www.linkedin.com',
      authorizationURL: 'https://www.linkedin.com/oauth/v2/authorization',
      tokenURL: 'https://www.linkedin.com/oauth/v2/accessToken',
      userInfoURL: 'https://api.linkedin.com/v2/userinfo',
      clientID: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      callbackURL: 'http://localhost:4000/auth/linkedin/callback',
      scope: ['openid', 'profile', 'email'],
    },
    async (issuer, sub, profile, jwtClaims, accessToken, refreshToken, params, done) => {
      try {
        let user = await User.findOne({ $or: [{ linkedinId: profile.id }, { email: profile.emails[0].value }] });
        if (!user) {
          user = new User({
            name: profile.displayName || `${profile.name.givenName} ${profile.name.familyName}`,
            email: profile.emails[0].value,
            linkedinId: profile.id,
            connections: [],
            pendingRequests: [],
            profileCompleted: false,
          });
          await user.save();
        } else if (!user.linkedinId) {
          user.linkedinId = profile.id;
          await user.save();
        }
        return done(null, { _id: user._id, email: user.email, name: user.name, linkedinId: user.linkedinId, profileCompleted: user.profileCompleted, id_token: params.id_token });
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user ? { _id: user._id, email: user.email, name: user.name, googleId: user.googleId, linkedinId: user.linkedinId, profileCompleted: user.profileCompleted } : false);
  } catch (err) {
    done(err, null);
  }
});

const ensureProfileCompleted = (req, res, next) => {
  if (!req.isAuthenticated()) return res.redirect('/login.html');
  if ((req.user.googleId || req.user.linkedinId) && !req.user.profileCompleted) return res.redirect('/auth/complete-profile');
  next();
};

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login.html' }), (req, res) => {
  res.redirect(req.user.profileCompleted ? '/profile' : '/auth/complete-profile');
});

router.get('/linkedin', passport.authenticate('openidconnect'));
router.get('/linkedin/callback', passport.authenticate('openidconnect', { failureRedirect: '/login.html' }), (req, res) => {
  res.redirect(req.user.profileCompleted ? '/profile' : '/auth/complete-profile');
});

router.get('/complete-profile', (req, res) => {
  if (!req.isAuthenticated()) return res.redirect('/login.html');
  if (!req.user.googleId && !req.user.linkedinId) return res.redirect('/profile');
  if (req.user.profileCompleted) return res.redirect('/profile');
  res.sendFile('complete-profile.html', { root: 'views' });
});

router.post('/complete-profile', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ message: 'Not authenticated' });
  if (!req.user.googleId && !req.user.linkedinId) return res.status(403).json({ message: 'Profile completion not required' });

  const { phone, password } = req.body;
  if (!phone || !password) return res.status(400).json({ message: 'Phone and password are required' });
  if (phone.length !== 11 || !/^\d{11}$/.test(phone)) return res.status(400).json({ message: 'Phone must be 11 digits' });
  if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.phone = phone;
    user.password = await bcrypt.hash(password, 10);
    user.profileCompleted = true;
    await user.save();
    res.json({ success: true, redirect: '/profile' });
  } catch (err) {
    res.status(500).json({ message: 'Internal Server Error: ' + err.message });
  }
});

router.get('/profile', ensureProfileCompleted, (req, res) => {
  res.sendFile('profile.html', { root: 'views' });
});

router.get('/profile/data', ensureProfileCompleted, (req, res) => {
  res.json({
    name: req.user.name,
    email: req.user.email,
    phone: req.user.phone,
    createdAt: req.user.createdAt,
    photoUrl: req.user.photoUrl || null,
  });
});

router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) console.error('❌ Logout error:', err);
    res.redirect('/login.html');
  });
});

module.exports = router;