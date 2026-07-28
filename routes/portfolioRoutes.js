const express = require('express');
const router = express.Router();
const { getAllPortfolio, getPortfolioById, createPortfolio, updatePortfolio, uploadProjectVideo, deletePortfolio } = require('../controllers/portfolioController');
const { protect, checkPermission, adminOnly } = require('../middleware/auth');
const { uploadSingleVideo, handleMulterError } = require('../middleware/upload');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', getAllPortfolio);
router.get('/:id', getPortfolioById);
router.post('/', protect, checkPermission('portfolio:edit'), upload.fields([{ name: 'mainImage', maxCount: 1 }, { name: 'images', maxCount: 10 }]), createPortfolio);
router.post('/:id/video', protect, checkPermission('portfolio:edit'), uploadSingleVideo, handleMulterError, uploadProjectVideo);
router.put('/:id', protect, checkPermission('portfolio:edit'), upload.fields([{ name: 'mainImage', maxCount: 1 }, { name: 'images', maxCount: 10 }]), updatePortfolio);
router.delete('/:id', protect, adminOnly, deletePortfolio);

module.exports = router;
