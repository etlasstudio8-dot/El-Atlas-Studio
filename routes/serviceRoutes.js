const express = require('express');
const router = express.Router();
const { getAllServices, getServiceById, createService, updateService, deleteService } = require('../controllers/serviceController');
const { protect, checkPermission, adminOnly } = require('../middleware/auth');
const { uploadSingleImage, handleMulterError } = require('../middleware/upload');

router.get('/', getAllServices);
router.get('/:id', getServiceById);
router.post('/', protect, checkPermission('services:edit'), uploadSingleImage, handleMulterError, createService);
router.put('/:id', protect, checkPermission('services:edit'), uploadSingleImage, handleMulterError, updateService);
router.delete('/:id', protect, adminOnly, deleteService);

module.exports = router;
