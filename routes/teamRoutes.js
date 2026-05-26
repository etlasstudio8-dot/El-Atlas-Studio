const express = require('express');
const router = express.Router();
const { getAllTeamMembers, getTeamMemberById, createTeamMember, updateTeamMember, deleteTeamMember } = require('../controllers/teamController');
const { protect, checkPermission, adminOnly } = require('../middleware/auth');
const { uploadSingleImage, handleMulterError } = require('../middleware/upload');

router.get('/', getAllTeamMembers);
router.get('/:id', getTeamMemberById);
router.post('/', protect, checkPermission('team:edit'), uploadSingleImage, handleMulterError, createTeamMember);
router.put('/:id', protect, checkPermission('team:edit'), uploadSingleImage, handleMulterError, updateTeamMember);
router.delete('/:id', protect, adminOnly, deleteTeamMember);

module.exports = router;
