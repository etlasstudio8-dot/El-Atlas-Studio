      const Portfolio = require('../models/Portfolio');
      const { uploadToCloudinary, uploadVideoToCloudinary, deleteFromCloudinary } = require('../middleware/upload');

      const categoryKind = category => {
        const value = String(category || '').toLowerCase();
        if (value === 'video' || value.includes('video')) return 'video';
        if (['web', 'software'].includes(value) || value.includes('web') || value.includes('software') || value.includes('mobile')) return 'web';
        if (['brand', 'design', 'marketing'].includes(value) || value.includes('brand') || value.includes('design') || value.includes('market')) return 'visual';
        return 'other';
      };

      const applyCategoryRules = record => {
        const kind = categoryKind(record.category);
        if (kind === 'video') {
          record.projectUrl = undefined;
          record.technologies = [];
          record.features = [];
          record.mainImage = undefined;
          record.images = [];
        } else {
          record.videoUrl = undefined;
          record.video = undefined;
          if (kind === 'visual') {
            record.projectUrl = undefined;
            record.technologies = [];
            record.features = [];
          }
        }
        return kind;
      };

      const cleanupAssetsForCategory = async (portfolio, kind) => {
        if (kind === 'video') {
          if (portfolio.mainImage?.publicId) await deleteFromCloudinary(portfolio.mainImage.publicId).catch(() => {});
          await Promise.all((portfolio.images || []).filter(img => img.publicId).map(img => deleteFromCloudinary(img.publicId).catch(() => {})));
        } else if (portfolio.video?.publicId) {
          await deleteFromCloudinary(portfolio.video.publicId, 'video').catch(() => {});
        }
      };

      // @desc    Get all portfolio items
      // @route   GET /api/portfolio
      // @access  Public
      exports.getAllPortfolio = async (req, res) => {
        try {
          const { category, status, isFeatured, limit = 50, summary } = req.query;

          let query = {};
          if (category) query.category = category;
          if (status) query.status = status;
          if (isFeatured !== undefined) query.isFeatured = isFeatured === 'true';

          let portfolioQuery = Portfolio.find(query);
          // Home page cards do not need multi-megabyte base64 images or detail fields.
          // Individual project pages still receive the complete document.
          if (summary === 'true') {
            portfolioQuery = portfolioQuery.select('-mainImage -images -features -technologies');
          }

          const portfolio = await portfolioQuery
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
          const kind = categoryKind(portfolioData.category);

          // Handle main image
          if (kind !== 'video' && req.files && req.files.mainImage) {
            const upload = await uploadToCloudinary(req.files.mainImage[0], 'el-atlas/portfolio');
            portfolioData.mainImage = { url: upload.url, publicId: upload.publicId };
          }

          // Handle multiple images
          if (kind !== 'video' && req.files && req.files.images) {
            portfolioData.images = await Promise.all(
              req.files.images.map(async (file) => {
                const upload = await uploadToCloudinary(file, 'el-atlas/portfolio');
                return { url: upload.url, publicId: upload.publicId };
              })
            );
          }

          applyCategoryRules(portfolioData);
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

          const nextCategory = req.body.category || portfolio.category;
          const kind = categoryKind(nextCategory);
          await cleanupAssetsForCategory(portfolio, kind);
          portfolio.set(req.body);

          // Handle main image update
          if (kind !== 'video' && req.files && req.files.mainImage) {
            if (portfolio.mainImage?.publicId) {
              await deleteFromCloudinary(portfolio.mainImage.publicId);
            }
            const upload = await uploadToCloudinary(req.files.mainImage[0], 'el-atlas/portfolio');
            portfolio.mainImage = { url: upload.url, publicId: upload.publicId };
          }

          portfolio.updatedBy = req.user.id;
          applyCategoryRules(portfolio);
          await portfolio.save();

          res.status(200).json({ success: true, message: 'Portfolio updated successfully', data: portfolio });
        } catch (error) {
          res.status(500).json({ success: false, message: 'Error updating portfolio', error: error.message });
        }
      };

      exports.uploadProjectVideo = async (req, res) => {
        try {
          if (!req.file) return res.status(400).json({ success: false, message: 'Please select a video file' });
          const portfolio = await Portfolio.findById(req.params.id);
          if (!portfolio) return res.status(404).json({ success: false, message: 'Portfolio not found' });
          if (categoryKind(portfolio.category) !== 'video') {
            return res.status(400).json({ success: false, message: 'Video upload is only available for the Video Editing category' });
          }

          const uploaded = await uploadVideoToCloudinary(req.file);
          if (portfolio.video?.publicId) {
            await deleteFromCloudinary(portfolio.video.publicId, 'video').catch(() => {});
          }
          portfolio.video = {
            url: uploaded.url,
            publicId: uploaded.publicId,
            format: uploaded.format,
            resourceType: uploaded.resourceType
          };
          portfolio.videoUrl = '';
          portfolio.updatedBy = req.user.id;
          await portfolio.save();
          res.json({ success: true, message: 'Project video uploaded successfully', data: portfolio });
        } catch (error) {
          res.status(500).json({ success: false, message: 'Error uploading project video', error: error.message });
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
            await Promise.all(portfolio.images.filter(img => img.publicId).map(img => deleteFromCloudinary(img.publicId)));
          }
          if (portfolio.video?.publicId) await deleteFromCloudinary(portfolio.video.publicId, 'video');

          await portfolio.deleteOne();
          res.status(200).json({ success: true, message: 'Portfolio deleted successfully' });
        } catch (error) {
          res.status(500).json({ success: false, message: 'Error deleting portfolio', error: error.message });
        }
      };
      
