const Content = require('../models/Content');
const { uploadToCloudinary, deleteFromCloudinary } = require('../middleware/upload');

// @desc    Get all content
// @route   GET /api/content
// @access  Public
exports.getAllContent = async (req, res) => {
  try {
    const { section, type, status, isActive } = req.query;

    let query = {};
    if (section) query.section = section;
    if (type) query.type = type;
    if (status) query.status = status;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const content = await Content.find(query)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ order: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: content.length,
      data: content
    });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching content',
      error: error.message
    });
  }
};

// @desc    Get single content by ID or key
// @route   GET /api/content/:id
// @access  Public
exports.getContentById = async (req, res) => {
  try {
    const content = await Content.findOne({
      $or: [{ _id: req.params.id }, { key: req.params.id }]
    })
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    res.status(200).json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Get content by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching content',
      error: error.message
    });
  }
};

// @desc    Create new content
// @route   POST /api/content
// @access  Private (requires permission)
exports.createContent = async (req, res) => {
  try {
    let contentData = {
      ...req.body,
      createdBy: req.user.id
    };

    // Handle image upload if file is provided
    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file, 'el-atlas/content');
      contentData.imageUrl = uploadResult.url;
      contentData.imagePublicId = uploadResult.publicId;
    }

    const content = await Content.create(contentData);

    res.status(201).json({
      success: true,
      message: 'Content created successfully',
      data: content
    });
  } catch (error) {
    console.error('Create content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating content',
      error: error.message
    });
  }
};

// @desc    Update content
// @route   PUT /api/content/:id
// @access  Private (requires permission)
exports.updateContent = async (req, res) => {
  try {
    let content = await Content.findById(req.params.id);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    // Handle image upload if new file is provided
    if (req.file) {
      // Delete old image from cloudinary if exists
      if (content.imagePublicId) {
        await deleteFromCloudinary(content.imagePublicId);
      }

      const uploadResult = await uploadToCloudinary(req.file, 'el-atlas/content');
      req.body.imageUrl = uploadResult.url;
      req.body.imagePublicId = uploadResult.publicId;
    }

    req.body.updatedBy = req.user.id;

    content = await Content.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Content updated successfully',
      data: content
    });
  } catch (error) {
    console.error('Update content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating content',
      error: error.message
    });
  }
};

// @desc    Delete content
// @route   DELETE /api/content/:id
// @access  Private (Admin only)
exports.deleteContent = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    // Delete image from cloudinary if exists
    if (content.imagePublicId) {
      await deleteFromCloudinary(content.imagePublicId);
    }

    await content.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Content deleted successfully'
    });
  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting content',
      error: error.message
    });
  }
};

// @desc    Bulk update content order
// @route   PUT /api/content/bulk/reorder
// @access  Private (requires permission)
exports.reorderContent = async (req, res) => {
  try {
    const { items } = req.body; // Array of { id, order }

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid items array'
      });
    }

    // Update all items
    const updatePromises = items.map(item =>
      Content.findByIdAndUpdate(item.id, { order: item.order })
    );

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: 'Content reordered successfully'
    });
  } catch (error) {
    console.error('Reorder content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error reordering content',
      error: error.message
    });
  }
};
