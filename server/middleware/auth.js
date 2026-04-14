function ensureAdmin(req, res, next) {
  if (req.session && req.session.isAdmin === true) {
    return next();
  }

  return res.status(401).json({
    success: false,
    message: 'Admin authentication required',
  });
}

module.exports = { ensureAdmin };
