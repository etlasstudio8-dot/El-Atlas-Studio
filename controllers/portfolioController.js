const Portfolio = require('../models/Portfolio');
const { uploadToCloudinary, deleteFromCloudinary } = require('../middleware/upload');

// @desc    Get all portfolio items
// @route   GET /api/portfolio
// @access  Public
exports.getAllPortfolio = async (req, res) => {
  try {
    const { category, status, isFeatured, limit = 50 } = req.query;

    let query = {};
    if (category) query.category = category;
    if (status) query.status = status;
    if (isFeatured !== undefined) query.isFeatured = isFeatured === 'true';

    const portfolio = await Portfolio.find(query)
      .populate('createdBy', 'name email')
      .sort({ isFeatured: -1, order: 1, createdAt: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: portfolio.length,
      data: portfolio
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching portfolio', error: error.message });
  }
};

// @desc    Get single portfolio item
// @route   GET /api/portfolio/:id
// @access  Public
exports.getPortfolioById = async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id)
      .populate('createdBy', 'name email avatar');

    if (!portfolio) {
      return res.status(404).json({ success: false, message: 'Portfolio item not found' });
    }

    // Increment views
    portfolio.views += 1;
    await portfolio.save();

    res.status(200).json({ success: true, data: portfolio });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching portfolio', error: error.message });
  }
};

// @desc    Create portfolio item
// @route   POST /api/portfolio
// @access  Private
exports.createPortfolio = async (req, res) => {
  try {
    const portfolioData = { ...req.body, createdBy: req.user.id };

    // Handle main image
    if (req.files && req.files.mainImage) {
      const upload = await uploadToCloudinary(req.files.mainImage[0], 'el-atlas/portfolio');
      portfolioData.mainImage = { url: upload.url, publicId: upload.publicId };
    }

    // Handle multiple images
    if (req.files && req.files.images) {
      portfolioData.images = await Promise.all(
        req.files.images.map(async (file) => {
          const upload = await uploadToCloudinary(file, 'el-atlas/portfolio');
          return { url: upload.url, publicId: upload.publicId };
        })
      );
    }

    const portfolio = await Portfolio.create(portfolioData);

    res.status(201).json({ success: true, message: 'Portfolio created successfully', data: portfolio });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating portfolio', error: error.message });
  }
};

// @desc    Update portfolio item
// @route   PUT /api/portfolio/:id
// @access  Private
exports.updatePortfolio = async (req, res) => {
  try {
    let portfolio = await Portfolio.findById(req.params.id);
    if (!portfolio) {
      return res.status(404).json({ success: false, message: 'Portfolio not found' });
    }

    // Handle main image update
    if (req.files && req.files.mainImage) {
      if (portfolio.mainImage?.publicId) {
        await deleteFromCloudinary(portfolio.mainImage.publicId);
      }
      const upload = await uploadToCloudinary(req.files.mainImage[0], 'el-atlas/portfolio');
      req.body.mainImage = { url: upload.url, publicId: upload.publicId };
    }

    req.body.updatedBy = req.user.id;
    portfolio = await Portfolio.findByIdAndUpdate(req.params.id, req.body, { new: true });

    res.status(200).json({ success: true, message: 'Portfolio updated successfully', data: portfolio });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating portfolio', error: error.message });
  }
};

// @desc    Delete portfolio item
// @route   DELETE /api/portfolio/:id
// @access  Private (Admin)
exports.deletePortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id);
    if (!portfolio) {
      return res.status(404).json({ success: false, message: 'Portfolio not found' });
    }

    // Delete images from cloudinary
    if (portfolio.mainImage?.publicId) await deleteFromCloudinary(portfolio.mainImage.publicId);
    if (portfolio.images) {
      await Promise.all(portfolio.images.map(img => deleteFromCloudinary(img.publicId)));
    }

    await portfolio.deleteOne();
    res.status(200).json({ success: true, message: 'Portfolio deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting portfolio', error: error.message });
  }
};
