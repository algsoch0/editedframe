const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'Sachin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Iit7065@';
const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'editedframe-jwt-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '12h';

function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice('Bearer '.length).trim();
}

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = jwt.sign(
      {
        isAdmin: true,
        adminName: ADMIN_USERNAME,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      success: true,
      adminName: ADMIN_USERNAME,
      token,
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Invalid name or password',
  });
});

router.post('/logout', (req, res) => {
  res.json({ success: true });
});

router.get('/me', (req, res) => {
  const token = getTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({ success: false, isAdmin: false, message: 'Missing token' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return res.json({
      success: true,
      isAdmin: decoded.isAdmin === true,
      adminName: decoded.adminName || ADMIN_USERNAME,
    });
  } catch (_error) {
    return res.status(401).json({ success: false, isAdmin: false, message: 'Invalid or expired token' });
  }

});

module.exports = router;
