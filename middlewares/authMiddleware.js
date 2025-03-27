const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No Token Provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid Token' });
  }
}

function verifyTokenAndAuthorization(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user._id == req.params.id || req.user.isAdmin) {
      next();
    } else {
      res.status(403).json({ message: 'You are not allowed to do this action' });
    }
  });
}

function verifyTokenAndAdmin(req, res, next) {
  verifyToken(req, res, () => {
    if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
    if (req.user.isAdmin) next();
    else res.status(403).json({ message: 'Only admins can perform this action' });
  });
}

module.exports = { verifyToken, verifyTokenAndAuthorization, verifyTokenAndAdmin };