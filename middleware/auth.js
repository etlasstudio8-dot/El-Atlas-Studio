// middleware/auth.js — FIXED VERSION
// Problem 1: checkPermission('portfolio:edit') fails when user has permissions:['all']
// Problem 2: adminOnly did not handle the 'all' permission either

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─── protect ─────────────────────────────────────────────────────────────────
exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};

// ─── checkPermission ──────────────────────────────────────────────────────────
// FIX: if user has permissions:['all'] OR role:'admin' → always allow
// Also accepts both 'portfolio:edit' and 'portfolio' style strings
exports.checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const userPerms = req.user.permissions || [];
    const userRole  = req.user.role || '';

    // Admin shortcut — 'all' permission or 'admin' role bypasses everything
    if (userPerms.includes('all') || userRole === 'admin') {
      return next();
    }

    // Exact match  (e.g. 'portfolio:edit')
    if (userPerms.includes(permission)) return next();

    // Prefix match (e.g. user has 'portfolio' and route requires 'portfolio:edit')
    const prefix = permission.split(':')[0];
    if (userPerms.includes(prefix)) return next();

    return res.status(403).json({
      success: false,
      message: `Access denied. Required permission: ${permission}`
    });
  };
};

// ─── adminOnly ────────────────────────────────────────────────────────────────
exports.adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  const isAdmin =
    req.user.role === 'admin' ||
    (req.user.permissions || []).includes('all');

  if (!isAdmin) {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};
