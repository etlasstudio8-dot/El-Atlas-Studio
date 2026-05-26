const Approval = require('../models/Approval');

// @desc    Get all approvals
exports.getAllApprovals = async (req, res) => {
  try {
    const { status, type, limit = 100 } = req.query;
    let query = {};
    if (status) query.status = status;
    if (type) query.type = type;

    const approvals = await Approval.find(query)
      .populate('requester', 'name email role avatar')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.status(200).json({ success: true, count: approvals.length, data: approvals });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching approvals', error: error.message });
  }
};

// @desc    Get my approval requests
exports.getMyApprovals = async (req, res) => {
  try {
    const approvals = await Approval.find({ requester: req.user.id })
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: approvals.length, data: approvals });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching approvals', error: error.message });
  }
};

// @desc    Create approval request
exports.createApproval = async (req, res) => {
  try {
    const { title, description, type, data, priority } = req.body;

    const approval = await Approval.create({
      requester: req.user.id,
      title,
      description,
      type,
      data,
      priority: priority || 'medium'
    });

    const populatedApproval = await Approval.findById(approval._id)
      .populate('requester', 'name email role avatar');

    res.status(201).json({ 
      success: true, 
      message: 'Approval request submitted successfully', 
      data: populatedApproval 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating approval', error: error.message });
  }
};

// @desc    Review approval (Admin only)
exports.reviewApproval = async (req, res) => {
  try {
    const { status, reviewNotes } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const approval = await Approval.findById(req.params.id);
    if (!approval) return res.status(404).json({ success: false, message: 'Approval not found' });

    if (approval.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Approval already reviewed' });
    }

    approval.status = status;
    approval.reviewedBy = req.user.id;
    approval.reviewedAt = new Date();
    approval.reviewNotes = reviewNotes;

    await approval.save();

    const populatedApproval = await Approval.findById(approval._id)
      .populate('requester', 'name email role')
      .populate('reviewedBy', 'name email');

    res.status(200).json({ 
      success: true, 
      message: `Approval ${status} successfully`, 
      data: populatedApproval 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error reviewing approval', error: error.message });
  }
};

// @desc    Delete approval
exports.deleteApproval = async (req, res) => {
  try {
    const approval = await Approval.findById(req.params.id);
    if (!approval) return res.status(404).json({ success: false, message: 'Approval not found' });

    // Only admin or requester can delete
    if (req.user.role !== 'admin' && approval.requester.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this approval' });
    }

    await approval.deleteOne();
    res.status(200).json({ success: true, message: 'Approval deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting approval', error: error.message });
  }
};
