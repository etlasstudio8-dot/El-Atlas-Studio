const Content = require('../models/Content');
const { uploadToCloudinary, deleteFromCloudinary } = require('../middleware/upload');

// Valid section enums from Content model
const VALID_SECTIONS = ['hero', 'about', 'services', 'portfolio', 'team', 'blog', 'testimonials', 'contact', 'footer', 'custom'];
const VALID_TYPES = ['text', 'image', 'gallery', 'list', 'card', 'form', 'link', 'video', 'social'];

// Helper: sanitize section to valid enum
function sanitizeSection(section) {
  if (!section) return 'custom';
  const s = String(section).toLowerCase().trim();
  // Try direct match first
  if (VALID_SECTIONS.includes(s)) return s;
  // Try partial match
  const match = VALID_SECTIONS.find(v => s.includes(v));
  return match || 'custom';
}

// Helper: sanitize type to valid enum
function sanitizeType(type) {
  if (!type) return 'text';
  const t = String(type).toLowerCase().trim();
  if (VALID_TYPES.includes(t)) return t;
  return 'text';
}

// @desc    Get all content
// @route   GET /api/content
// @access  Public
exports.getAllContent = async (req, res) => {
  try {
    const { section, type, status, isActive } = req.query;
    let query = {};
    if (section) query.section = sanitizeSection(section);
    if (type) query.type = sanitizeType(type);
    if (status) query.status = status;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const content = await Content.find(query)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ order: 1, createdAt: -1 });

    res.status(200).json({ success: true, count: content.length, data: content });
  } catch (error) {
    console.error('getAllContent error:', error);
    res.status(500).json({ success: false, message: 'Error fetching content', error: error.message });
  }
};

// @desc    Get single content by MongoDB ID or key string
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

    if (!content) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }
    res.status(200).json({ success: true, data: content });
  } catch (error) {
    console.error('getContentById error:', error);
    res.status(500).json({ success: false, message: 'Error fetching content', error: error.message });
  }
};

// @desc    Create content
// @route   POST /api/content
// @access  Private (content:edit)
exports.createContent = async (req, res) => {
  try {
    const {
      key, title, content, value, // 'value' accepted as alias for 'content'
      section, type, status, order, isActive, metadata
    } = req.body;

    // key is required and must be unique
    if (!key) {
      return res.status(400).json({ success: false, message: 'key field is required' });
    }

    // content field is required by model — fallback to 'value' alias or empty string
    const contentValue = content !== undefined ? content : (value !== undefined ? value : '');

    const contentData = {
      key: String(key).trim(),
      title: title || key,
      content: contentValue,
      section: sanitizeSection(section),
      type: sanitizeType(type),
      status: status || 'published',
      order: order !== undefined ? Number(order) : 0,
      isActive: isActive !== undefined ? isActive : true,
      metadata: metadata || {},
      createdBy: req.user.id,
    };

    // Handle image upload
    if (req.file) {
      const upload = await uploadToCloudinary(req.file, 'el-atlas/content');
      contentData.imageUrl = upload.url;
      contentData.imagePublicId = upload.publicId;
    }

    const created = await Content.create(contentData);
    res.status(201).json({ success: true, message: 'Content created successfully', data: created });
  } catch (error) {
    console.error('createContent error:', error);
    // Duplicate key on unique 'key' field
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Content with this key already exists. Use PUT to update it.' });
    }
    // Mongoose validation error — return readable message
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message).join(', ');
      return res.status(400).json({ success: false, message: messages });
    }
    res.status(500).json({ success: false, message: 'Error creating content', error: error.message });
  }
};

// @desc    Update content
// @route   PUT /api/content/:id
// @access  Private (content:edit)
exports.updateContent = async (req, res) => {
  try {
    const existing = await Content.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }

    // Build update object — only include fields that were sent
    const updates = { updatedBy: req.user.id };

    // Accept 'value' as alias for 'content'
    if (req.body.content !== undefined) updates.content = req.body.content;
    else if (req.body.value !== undefined) updates.content = req.body.value;

    if (req.body.title !== undefined)    updates.title    = req.body.title;
    if (req.body.section !== undefined)  updates.section  = sanitizeSection(req.body.section);
    if (req.body.type !== undefined)     updates.type     = sanitizeType(req.body.type);
    if (req.body.status !== undefined)   updates.status   = req.body.status;
    if (req.body.order !== undefined)    updates.order    = Number(req.body.order);
    if (req.body.isActive !== undefined) updates.isActive = req.body.isActive;
    if (req.body.metadata !== undefined) updates.metadata = req.body.metadata;

    // Handle image upload
    if (req.file) {
      if (existing.imagePublicId) {
        await deleteFromCloudinary(existing.imagePublicId);
      }
      const upload = await uploadToCloudinary(req.file, 'el-atlas/content');
      updates.imageUrl = upload.url;
      updates.imagePublicId = upload.publicId;
    }

    const updated = await Content.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: false } // runValidators: false so partial updates work
    );

    res.status(200).json({ success: true, message: 'Content updated successfully', data: updated });
  } catch (error) {
    console.error('updateContent error:', error);
    res.status(500).json({ success: false, message: 'Error updating content', error: error.message });
  }
};

// @desc    Delete content
// @route   DELETE /api/content/:id
// @access  Private (Admin)
exports.deleteContent = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (!content) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }

    // Clean up Cloudinary image if exists
    if (content.imagePublicId) {
      await deleteFromCloudinary(content.imagePublicId);
    }

    await content.deleteOne();
    res.status(200).json({ success: true, message: 'Content deleted successfully' });
  } catch (error) {
    console.error('deleteContent error:', error);
    res.status(500).json({ success: false, message: 'Error deleting content', error: error.message });
  }
};

// @desc    Bulk reorder content items
// @route   PUT /api/content/bulk/reorder
// @access  Private (content:edit)
exports.reorderContent = async (req, res) => {
  try {
    const { items } = req.body; // [{ id: '...', order: 0 }, ...]

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
    console.error('reorderContent error:', error);
    res.status(500).json({ success: false, message: 'Error reordering content', error: error.message });
  }
};

