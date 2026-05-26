const express = require('express');
const router = express.Router();
const { getAllBlogs, getBlogById, createBlog, updateBlog, deleteBlog } = require('../controllers/blogController');
const { protect, checkPermission, adminOnly } = require('../middleware/auth');
const { uploadSingleImage, handleMulterError } = require('../middleware/upload');

router.get('/', getAllBlogs);
router.get('/:id', getBlogById);
router.post('/', protect, checkPermission('blog:edit'), uploadSingleImage, handleMulterError, createBlog);
router.put('/:id', protect, checkPermission('blog:edit'), uploadSingleImage, handleMulterError, updateBlog);
router.delete('/:id', protect, adminOnly, deleteBlog);

module.exports = router;
