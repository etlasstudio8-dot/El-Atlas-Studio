const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, updateUser, updateUserRole, toggleUserStatus, deleteUser, uploadAvatar } = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');
const { uploadSingleImage, handleMulterError } = require('../middleware/upload');

router.get('/', protect, adminOnly, getAllUsers);
router.get('/:id', protect, adminOnly, getUserById);
// Used by the admin dashboard for employee details, access and password resets.
router.put('/:id', protect, adminOnly, updateUser);
router.put('/:id/role', protect, adminOnly, updateUserRole);
router.put('/:id/toggle', protect, adminOnly, toggleUserStatus);
router.delete('/:id', protect, adminOnly, deleteUser);
router.post('/avatar', protect, uploadSingleImage, handleMulterError, uploadAvatar);

module.exports = router;
