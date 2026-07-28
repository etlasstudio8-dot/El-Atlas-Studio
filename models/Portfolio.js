  const mongoose = require('mongoose');

  const portfolioSchema = new mongoose.Schema({
    title: {
      type: String,
      required: [true, 'Portfolio title is required'],
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true,
      enum: [
        'web', 'software', 'brand', 'video', 'design', 'marketing', 'other',
        'Web Development', 'Mobile App', 'UI/UX Design', 'Branding',
        'Video Editing', 'Digital Marketing', 'E-commerce', 'Custom'
      ]
    },
    tags: [{
      type: String,
      trim: true
    }],
    mainImage: {
      url: String,
      publicId: String
    },
    images: [{
      url: String,
      publicId: String,
      caption: String
    }],
    videoUrl: {
      type: String,
      trim: true
    },
    video: {
      url: String,
      publicId: String,
      format: String,
      resourceType: String
    },
    client: {
      type: String,
      trim: true
    },
    projectUrl: {
      type: String,
      trim: true
    },
    completionDate: {
      type: Date
    },
    technologies: [{
      type: String,
      trim: true
    }],
    features: [{
      type: String,
      trim: true
    }],
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published'
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    order: {
      type: Number,
      default: 0
    },
    views: {
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

  portfolioSchema.index({ status: 1, isFeatured: -1, createdAt: -1 });

  module.exports = mongoose.model('Portfolio', portfolioSchema);
