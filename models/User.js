const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    lowercase: true,
    trim: true,
    minlength: 3
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'editor', 'viewer', 'moderator', 'contributor'],
    default: 'viewer'
  },
  permissions: {
    type: [String],
    default: []
  },
  avatar: {
    type: String,
    default: ''
  },
  avatarImg: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    
    // Auto-generate avatar initials if not provided
    if (!this.avatar) {
      const nameParts = this.name.split(' ');
      this.avatar = nameParts.map(part => part[0]).join('').toUpperCase().slice(0, 2);
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get role permissions
userSchema.methods.getRolePermissions = function() {
  const rolePermissions = {
    admin: ['all'],
    editor: ['portfolio:edit', 'services:edit', 'blog:edit', 'content:edit', 'team:edit', 'sections:edit', 'clients:view'],
    moderator: ['blog:edit', 'content:edit', 'clients:view', 'clients:respond'],
    contributor: ['blog:create', 'content:suggest', 'clients:view'],
    viewer: ['portfolio:view', 'services:view', 'blog:view', 'content:view']
  };
  
  return rolePermissions[this.role] || [];
};

// Check if user has permission
userSchema.methods.hasPermission = function(permission) {
  if (this.role === 'admin') return true;
  
  const userPerms = this.permissions.length > 0 ? this.permissions : this.getRolePermissions();
  
  if (userPerms.includes('all')) return true;
  
  return userPerms.some(perm => {
    if (perm === permission) return true;
    if (perm.endsWith(':edit') && permission.startsWith(perm.split(':')[0])) return true;
    return false;
  });
};

module.exports = mongoose.model('User', userSchema);
