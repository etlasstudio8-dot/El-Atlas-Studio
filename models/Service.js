const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Service title is required'],
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String, // SVG or icon class
    default: ''
  },
  image: {
    url: String,
    publicId: String
  },
  features: [{
    title: String,
    description: String
  }],
  pricing: {
    startingPrice: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    pricingModel: {
      type: String,
      enum: ['fixed', 'hourly', 'project', 'custom'],
      default: 'custom'
    }
  },
  category: {
    type: String,
    enum: ['Development', 'Design', 'Marketing', 'Consulting', 'Other'],
    default: 'Other'
  },
  deliverables: [{
    type: String,
    trim: true
  }],
  timeline: {
    type: String,
    default: 'Varies by project'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'coming-soon'],
    default: 'active'
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
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

serviceSchema.index({ status: 1, isFeatured: -1, order: 1 });

module.exports = mongoose.model('Service', serviceSchema);
