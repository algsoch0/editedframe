const express = require('express');

const router = express.Router();

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'Sachin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Iit7065@';

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    req.session.adminName = ADMIN_USERNAME;

    return res.json({
      success: true,
      adminName: ADMIN_USERNAME,
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Invalid name or password',
  });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('editedframe.sid');
    res.json({ success: true });
  });
});

router.get('/me', (req, res) => {
  if (req.session && req.session.isAdmin === true) {
    return res.json({
      success: true,
      isAdmin: true,
      adminName: req.session.adminName || ADMIN_USERNAME,
    });
  }

  return res.status(401).json({
    success: false,
    isAdmin: false,
  });
});

module.exports = router;
