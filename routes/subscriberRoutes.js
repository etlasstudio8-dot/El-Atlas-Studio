const express = require('express');
const { subscribe, getSubscribers, unsubscribe } = require('../controllers/subscriberController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.post('/', subscribe);
router.get('/', protect, adminOnly, getSubscribers);
router.patch('/:id/unsubscribe', protect, adminOnly, unsubscribe);

module.exports = router;
