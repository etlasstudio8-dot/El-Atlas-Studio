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

    res.status(200).json({ success: true, count: content.length, data: content });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching content', error: error.message });
  }
};

// @desc    Get single content by ID or key
// @route   GET /api/content/:id
// @access  Public
exports.getContentById = async (req, res) => {
  try {
    const param = req.params.id;
    const isObjectId = /^[a-f\d]{24}$/i.test(param);

    const content = await Content.findOne(
      isObjectId ? { _id: param } : { key: param }
    )
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!content) return res.status(404).json({ success: false, message: 'Content not found' });
    res.status(200).json({ success: true, data: content });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching content', error: error.message });
  }
};

// @desc    Create content
// @route   POST /api/content
// @access  Private (content:edit)
exports.createContent = async (req, res) => {
  try {
    const contentData = { ...req.body, createdBy: req.user.id };

    if (req.file) {
      const upload = await uploadToCloudinary(req.file, 'el-atlas/content');
      contentData.imageUrl = upload.url;
      contentData.imagePublicId = upload.publicId;
    }

    const content = await Content.create(contentData);
    res.status(201).json({ success: true, message: 'Content created successfully', data: content });
  } catch (error) {
    // Duplicate key (unique `key` field)
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Content with this key already exists' });
    }
    res.status(500).json({ success: false, message: 'Error creating content', error: error.message });
  }
};

// @desc    Update content
// @route   PUT /api/content/:id
// @access  Private (content:edit)
exports.updateContent = async (req, res) => {
  try {
    let content = await Content.findById(req.params.id);
    if (!content) return res.status(404).json({ success: false, message: 'Content not found' });

    if (req.file) {
      // Delete old image from Cloudinary
      if (content.imagePublicId) await deleteFromCloudinary(content.imagePublicId);
      const upload = await uploadToCloudinary(req.file, 'el-atlas/content');
      req.body.imageUrl = upload.url;
      req.body.imagePublicId = upload.publicId;
    }

    req.body.updatedBy = req.user.id;
    content = await Content.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, message: 'Content updated successfully', data: content });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating content', error: error.message });
  }
};

// @desc    Delete content
// @route   DELETE /api/content/:id
// @access  Private (Admin)
exports.deleteContent = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (!content) return res.status(404).json({ success: false, message: 'Content not found' });

    if (content.imagePublicId) await deleteFromCloudinary(content.imagePublicId);
    await content.deleteOne();

    res.status(200).json({ success: true, message: 'Content deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting content', error: error.message });
  }
};

// @desc    Reorder content items (bulk update order)
// @route   PUT /api/content/bulk/reorder
// @access  Private (content:edit)
exports.reorderContent = async (req, res) => {
  try {
    const { items } = req.body; // Expected: [{ id: '...', order: 0 }, ...]

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'items array is required' });
    }

    await Promise.all(
      items.map(({ id, order }) =>
        Content.findByIdAndUpdate(id, { order: Number(order) })
      )
    );

    res.status(200).json({ success: true, message: 'Content reordered successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error reordering content', error: error.message });
  }
};
