const express = require('express');
const router = express.Router();
const { getAllApprovals, getMyApprovals, createApproval, reviewApproval, deleteApproval } = require('../controllers/approvalController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', protect, adminOnly, getAllApprovals);
router.get('/my', protect, getMyApprovals);
router.post('/', protect, createApproval);
router.put('/:id/review', protect, adminOnly, reviewApproval);
router.delete('/:id', protect, deleteApproval);

module.exports = router;
