const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateUser,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
  uploadAvatar
} = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');
const { uploadSingleImage, handleMulterError } = require('../middleware/upload');

router.get('/', protect, adminOnly, getAllUsers);
router.get('/:id', protect, adminOnly, getUserById);
// Specific sub-routes MUST come before the generic /:id route
router.put('/:id/role', protect, adminOnly, updateUserRole);
router.put('/:id/toggle', protect, adminOnly, toggleUserStatus);
// Generic update — handles name, role, permissions, position, password
router.put('/:id', protect, adminOnly, updateUser);
router.delete('/:id', protect, adminOnly, deleteUser);
router.post('/avatar', protect, uploadSingleImage, handleMulterError, uploadAvatar);

module.exports = router;
