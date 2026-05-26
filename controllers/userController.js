const User = require('../models/User');
const { uploadToCloudinary, deleteFromCloudinary } = require('../middleware/upload');

// @desc    Get all users (Admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const { role, isActive, limit = 50 } = req.query;
    let query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const users = await User.find(query).select('-password').sort({ createdAt: -1 }).limit(parseInt(limit));
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching users', error: error.message });
  }
};

// @desc    Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching user', error: error.message });
  }
};

// @desc    Update user role and permissions (Admin only)
exports.updateUserRole = async (req, res) => {
  try {
    const { role, permissions } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Prevent admin from changing their own role
    if (user.email === process.env.ADMIN_EMAIL && req.user.id !== user.id) {
      return res.status(403).json({ success: false, message: 'Cannot modify super admin role' });
    }

    if (role) user.role = role;
    if (permissions) user.permissions = permissions;

    await user.save();

    res.status(200).json({ 
      success: true, 
      message: 'User role/permissions updated successfully', 
      data: { id: user._id, name: user.name, email: user.email, role: user.role, permissions: user.permissions }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating user', error: error.message });
  }
};

// @desc    Deactivate/Activate user (Admin only)
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Prevent admin from deactivating themselves
    if (user.email === process.env.ADMIN_EMAIL) {
      return res.status(403).json({ success: false, message: 'Cannot deactivate super admin' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({ 
      success: true, 
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`, 
      data: { id: user._id, isActive: user.isActive }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error toggling user status', error: error.message });
  }
};

// @desc    Delete user (Admin only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Prevent admin from deleting themselves
    if (user.email === process.env.ADMIN_EMAIL) {
      return res.status(403).json({ success: false, message: 'Cannot delete super admin' });
    }

    await user.deleteOne();
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting user', error: error.message });
  }
};

// @desc    Upload user avatar
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Delete old avatar if exists
    if (user.avatarImg && user.avatarImg.includes('cloudinary')) {
      const publicIdMatch = user.avatarImg.match(/\/([^\/]+)\.[^.]+$/);
      if (publicIdMatch) {
        await deleteFromCloudinary(`el-atlas/avatars/${publicIdMatch[1]}`);
      }
    }

    // Upload new avatar
    const upload = await uploadToCloudinary(req.file, 'el-atlas/avatars');
    user.avatarImg = upload.url;
    await user.save();

    res.status(200).json({ 
      success: true, 
      message: 'Avatar uploaded successfully', 
      data: { avatarImg: user.avatarImg }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error uploading avatar', error: error.message });
  }
};
