  const User = require('../models/User');
  const jwt = require('jsonwebtoken');

  // Generate JWT Token
  const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });
  };

  // @desc    Register new user
  // @route   POST /api/auth/register
  // @access  Public (but only admin can set roles)
  exports.register = async (req, res) => {
    try {
      const { name, email, username, password, role, permissions } = req.body;

      // Check if user already exists
      const userExists = await User.findOne({ $or: [{ email }, { username }] });
      if (userExists) {
        return res.status(400).json({
          success: false,
          message: 'User with this email or username already exists'
        });
      }

      // Only admin can create users with specific roles
      let userRole = 'viewer'; // default role
      let userPermissions = [];

      if (req.user && req.user.role === 'admin') {
        userRole = role || 'viewer';
        userPermissions = permissions || [];
      }

      // Create user
      const user = await User.create({
        name,
        email,
        username,
        password,
        role: userRole,
        permissions: userPermissions
      });

      // Generate token
      const token = generateToken(user._id);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            username: user.username,
            role: user.role,
            avatar: user.avatar,
            avatarImg: user.avatarImg,
            permissions: user.permissions
          },
          token
        }
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({
        success: false,
        message: 'Error registering user',
        error: error.message
      });
    }
  };

  // @desc    Login user
  // @route   POST /api/auth/login
  // @access  Public
  exports.login = async (req, res) => {
    try {
      const { username, password } = req.body;

      // Validate input
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Please provide username and password'
        });
      }

      // Check if user exists and get password
      const user = await User.findOne({ 
        $or: [{ username }, { email: username }] 
      }).select('+password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check if account is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Your account has been deactivated. Please contact admin.'
        });
      }

      // Check password
      const isPasswordMatch = await user.comparePassword(password);
      if (!isPasswordMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate token
      const token = generateToken(user._id);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            username: user.username,
            role: user.role,
            avatar: user.avatar,
            avatarImg: user.avatarImg,
            permissions: user.permissions.length > 0 ? user.permissions : user.getRolePermissions(),
            lastLogin: user.lastLogin
          },
          token
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Error logging in',
        error: error.message
      });
    }
  };

  // @desc    Get current logged in user
  // @route   GET /api/auth/me
  // @access  Private
  exports.getMe = async (req, res) => {
    try {
      const user = await User.findById(req.user.id);

      res.status(200).json({
        success: true,
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          username: user.username,
          role: user.role,
          avatar: user.avatar,
          avatarImg: user.avatarImg,
          permissions: user.permissions.length > 0 ? user.permissions : user.getRolePermissions(),
          lastLogin: user.lastLogin,
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      console.error('Get me error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching user data',
        error: error.message
      });
    }
  };

  // @desc    Update user profile
  // @route   PUT /api/auth/profile
  // @access  Private
  exports.updateProfile = async (req, res) => {
    try {
      const { name, email, avatarImg } = req.body;

      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Update fields
      if (name) user.name = name;
      if (email) user.email = email;
      if (avatarImg) user.avatarImg = avatarImg;

      // Regenerate avatar initials if name changed
      if (name) {
        const nameParts = name.split(' ');
        user.avatar = nameParts.map(part => part[0]).join('').toUpperCase().slice(0, 2);
      }

      await user.save();

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          avatarImg: user.avatarImg
        }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating profile',
        error: error.message
      });
    }
  };

  // @desc    Change password
  // @route   PUT /api/auth/password
  // @access  Private
  exports.changePassword = async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Please provide current and new password'
        });
      }

      const user = await User.findById(req.user.id).select('+password');

      // Check current password
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Validate new password
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters'
        });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Error changing password',
        error: error.message
      });
    }
  };

  // @desc    Logout user (client-side token removal)
  // @route   POST /api/auth/logout
  // @access  Private
  exports.logout = async (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  };
