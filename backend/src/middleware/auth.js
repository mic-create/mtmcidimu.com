// middleware/auth.js
const jwt = require('jsonwebtoken');

// 1. Verify JWT Token
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Contains id, email, role, etc.
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired authentication token.' });
  }
};

// 2. Enforce Admin / Staff Authorization
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Forbidden. You do not have permission to access this administrative resource.' 
      });
    }
    next();
  };
};

module.exports = {
  authenticateJWT,
  authorizeRoles
};