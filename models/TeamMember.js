const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  position: {
    type: String,
    required: [true, 'Position is required'],
    trim: true
  },
  bio: {
    type: String,
    maxlength: 500
  },
  image: {
    url: String,
    publicId: String
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  social: {
    linkedin: String,
    twitter: String,
    github: String,
    behance: String,
    dribbble: String,
    instagram: String
  },
  expertise: [{
    type: String,
    trim: true
  }],
  experience: {
    type: Number, // years
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'alumni'],
    default: 'active'
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  showOnWebsite: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

teamMemberSchema.index({ showOnWebsite: 1, status: 1, isFeatured: -1, order: 1 });

module.exports = mongoose.model('TeamMember', teamMemberSchema);

