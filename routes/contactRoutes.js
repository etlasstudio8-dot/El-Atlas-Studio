const express = require('express');
const router = express.Router();
const { getAllContacts, getContactById, createContact, updateContact, replyToContact, deleteContact } = require('../controllers/contactController');
const { protect, checkPermission, adminOnly } = require('../middleware/auth');

router.get('/', protect, checkPermission('clients:view'), getAllContacts);
router.get('/:id', protect, checkPermission('clients:view'), getContactById);
router.post('/', createContact); // Public - for contact form submissions
router.put('/:id', protect, checkPermission('clients:view'), updateContact);
router.post('/:id/reply', protect, checkPermission('clients:respond'), replyToContact);
router.delete('/:id', protect, adminOnly, deleteContact);

module.exports = router;
