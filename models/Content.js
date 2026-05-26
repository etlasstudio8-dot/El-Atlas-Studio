const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  section: {
    type: String,
    required: true,
    enum: ['hero', 'about', 'services', 'portfolio', 'team', 'blog', 'testimonials', 'contact', 'footer', 'custom']
  },
  type: {
    type: String,
    required: true,
    enum: ['text', 'image', 'gallery', 'list', 'card', 'form', 'link', 'video', 'social']
  },
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  title: {
    type: String,
    trim: true
  },
  content: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  imageUrl: {
    type: String
  },
  imagePublicId: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
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

// Index for faster queries
contentSchema.index({ section: 1, status: 1, isActive: 1 });
contentSchema.index({ key: 1 });

module.exports = mongoose.model('Content', contentSchema);
