const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'editedframe-jwt-secret-change-me';

function ensureAdmin(req, res, next) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Admin authentication required',
    });
  }

  const token = authHeader.slice('Bearer '.length).trim();

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded && decoded.isAdmin === true) {
      req.admin = decoded;
      return next();
    }
  } catch (_error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired admin token',
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Admin authentication required',
  });
}

module.exports = { ensureAdmin };
