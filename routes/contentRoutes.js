const express = require('express');
const router = express.Router();
const { getAllContent, getContentById, createContent, updateContent, deleteContent, reorderContent } = require('../controllers/contentController');
const { protect, checkPermission, adminOnly } = require('../middleware/auth');
const { uploadSingleImage, handleMulterError } = require('../middleware/upload');

router.get('/', getAllContent);
router.get('/:id', getContentById);
router.post('/', protect, checkPermission('content:edit'), uploadSingleImage, handleMulterError, createContent);
router.put('/:id', protect, checkPermission('content:edit'), uploadSingleImage, handleMulterError, updateContent);
router.delete('/:id', protect, adminOnly, deleteContent);
router.put('/bulk/reorder', protect, checkPermission('content:edit'), reorderContent);

module.exports = router;
