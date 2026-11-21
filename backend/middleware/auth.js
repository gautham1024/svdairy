const jwt = require('jsonwebtoken');

module.exports = function requireAuth(req, res, next) {
  try {
    req.admin = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Not logged in' });
  }
};
