const bcrypt = require('bcrypt');
const { User, validateSignupUser, validateLoginUser } = require('../models/User');

exports.signup = async (req, res) => {
  const { error } = validateSignupUser(req.body);
  if (error) return res.status(400).json({ errors: error.details.map(err => ({ path: err.path[0], msg: err.message })) });

  try {
    const user = new User({
      name: req.body.name,
      phone: req.body.phone,
      email: req.body.email,
      password: req.body.password,
      age: req.body.age,
    });
    user.password = await bcrypt.hash(user.password, 10);
    await user.save();
    const token = user.generateToken();
    const { password, ...data } = user._doc;
    res.status(200).json({ ...data, token, message: 'SignUp Successful' });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ errors: [{ path: 'email', msg: 'Email already exists' }] });
    res.status(500).json({ error: 'An error occurred while saving the user.' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ errors: [{ path: 'email', msg: 'User not found' }] });
    if (!user.password) return res.status(400).json({ errors: [{ path: 'password', msg: 'No password set. Use Google/LinkedIn or set a password.' }] });
    if (!(await bcrypt.compare(password, user.password))) return res.status(400).json({ errors: [{ path: 'password', msg: 'Incorrect password' }] });

    req.login(user, (err) => {
      if (err) return res.status(500).json({ message: 'Internal server error' });
      res.json({ success: true, redirect: user.profileCompleted ? '/profile' : '/auth/complete-profile' });
    });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.checkAuth = (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ authenticated: true, email: req.user.email });
  } else {
    res.status(401).json({ authenticated: false });
  }
};