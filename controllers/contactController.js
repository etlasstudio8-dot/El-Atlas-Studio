const Contact = require('../models/Contact');

exports.getAllContacts = async (req, res) => {
  try {
    const { status, limit = 100 } = req.query;
    let query = {};
    if (status) query.status = status;

    const contacts = await Contact.find(query)
      .populate('assignedTo', 'name email')
      .populate('repliedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.status(200).json({ success: true, count: contacts.length, data: contacts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching contacts', error: error.message });
  }
};

exports.getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('repliedBy', 'name email');

    if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });

    // Mark as read
    if (contact.status === 'new') {
      contact.status = 'read';
      await contact.save();
    }

    res.status(200).json({ success: true, data: contact });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching contact', error: error.message });
  }
};

exports.createContact = async (req, res) => {
  try {
    const { name, email, phone, company, service, message } = req.body;

    const contact = await Contact.create({
      name,
      email,
      phone,
      company,
      service,
      message,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json({ success: true, message: 'Message sent successfully', data: contact });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error sending message', error: error.message });
  }
};

exports.updateContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });
    res.status(200).json({ success: true, message: 'Contact updated successfully', data: contact });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating contact', error: error.message });
  }
};

exports.replyToContact = async (req, res) => {
  try {
    const { notes } = req.body;
    const contact = await Contact.findById(req.params.id);

    if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });

    contact.status = 'replied';
    contact.notes = notes;
    contact.repliedBy = req.user.id;
    contact.repliedAt = new Date();
    await contact.save();

    res.status(200).json({ success: true, message: 'Reply sent successfully', data: contact });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error replying to contact', error: error.message });
  }
};

exports.deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });
    await contact.deleteOne();
    res.status(200).json({ success: true, message: 'Contact deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting contact', error: error.message });
  }
};

