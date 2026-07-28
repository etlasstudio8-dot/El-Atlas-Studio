const Subscriber = require('../models/Subscriber');

exports.subscribe = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const subscriber = await Subscriber.findOneAndUpdate(
      { email },
      { email, isActive: true },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.status(201).json({ success: true, message: 'Subscribed successfully', data: subscriber });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || 'Unable to subscribe' });
  }
};

exports.getSubscribers = async (req, res) => {
  try {
    const subscribers = await Subscriber.find().sort({ createdAt: -1 }).select('-__v');
    res.json({ success: true, count: subscribers.length, data: subscribers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to load subscribers' });
  }
};

exports.unsubscribe = async (req, res) => {
  try {
    const subscriber = await Subscriber.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!subscriber) return res.status(404).json({ success: false, message: 'Subscriber not found' });
    res.json({ success: true, message: 'Subscriber deactivated', data: subscriber });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Unable to update subscriber' });
  }
};
