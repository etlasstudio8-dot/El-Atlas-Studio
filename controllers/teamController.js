const TeamMember = require('../models/TeamMember');
const { uploadToCloudinary, deleteFromCloudinary } = require('../middleware/upload');

const getTeamMembers = async (req, res, includeHidden = false) => {
  try {
    const { status, limit = 50 } = req.query;
    let query = {};
    if (status) query.status = status;
    if (!includeHidden) query.showOnWebsite = { $ne: false };

    const team = await TeamMember.find(query).populate('createdBy', 'name email').sort({ isFeatured: -1, order: 1 }).limit(parseInt(limit));
    res.status(200).json({ success: true, count: team.length, data: team });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching team members', error: error.message });
  }
};

exports.getAllTeamMembers = (req, res) => getTeamMembers(req, res);

exports.getAllTeamMembersAdmin = (req, res) => getTeamMembers(req, res, true);

exports.getTeamMemberById = async (req, res) => {
  try {
    const member = await TeamMember.findOne({
      _id: req.params.id,
      showOnWebsite: { $ne: false }
    }).populate('createdBy', 'name email');
    if (!member) return res.status(404).json({ success: false, message: 'Team member not found' });
    res.status(200).json({ success: true, data: member });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching team member', error: error.message });
  }
};

exports.createTeamMember = async (req, res) => {
  try {
    const memberData = {
      ...req.body,
      name: String(req.body.name || '').trim(),
      position: String(req.body.position || '').trim() || 'Team Member',
      createdBy: req.user.id
    };
    if (!memberData.name) {
      return res.status(400).json({ success: false, message: 'Team member name is required' });
    }
    if (req.file) {
      const upload = await uploadToCloudinary(req.file, 'el-atlas/team');
      memberData.image = { url: upload.url, publicId: upload.publicId };
    }
    const member = await TeamMember.create(memberData);
    res.status(201).json({ success: true, message: 'Team member created successfully', data: member });
  } catch (error) {
    const status = error.name === 'ValidationError' ? 400 : 500;
    res.status(status).json({ success: false, message: error.message || 'Error creating team member' });
  }
};

exports.updateTeamMember = async (req, res) => {
  try {
    let member = await TeamMember.findById(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: 'Team member not found' });
    if (req.file) {
      if (member.image?.publicId) await deleteFromCloudinary(member.image.publicId);
      const upload = await uploadToCloudinary(req.file, 'el-atlas/team');
      req.body.image = { url: upload.url, publicId: upload.publicId };
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'name')) {
      req.body.name = String(req.body.name || '').trim();
      if (!req.body.name) {
        return res.status(400).json({ success: false, message: 'Team member name is required' });
      }
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'position')) {
      req.body.position = String(req.body.position || '').trim() || 'Team Member';
    }
    req.body.updatedBy = req.user.id;
    member = await TeamMember.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, message: 'Team member updated successfully', data: member });
  } catch (error) {
    const status = error.name === 'ValidationError' ? 400 : 500;
    res.status(status).json({ success: false, message: error.message || 'Error updating team member' });
  }
};

exports.deleteTeamMember = async (req, res) => {
  try {
    const member = await TeamMember.findById(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: 'Team member not found' });
    if (member.image?.publicId) await deleteFromCloudinary(member.image.publicId);
    await member.deleteOne();
    res.status(200).json({ success: true, message: 'Team member deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting team member', error: error.message });
  }
};


