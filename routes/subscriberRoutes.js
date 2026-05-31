const express = require('express');
const router = express.Router();
const Subscriber = require('../models/Subscriber');
const { Resend } = require('resend');

const resend = new Resend('re_fLb3MR8g_968qyUekm7gTiHnyXBVTiDe7');

router.post('/', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });

    // Duplicate check
    const existing = await Subscriber.findOne({ email });
    if (existing) return res.status(409).json({ success: false, message: 'Already subscribed' });

    await Subscriber.create({ email });

   // Welcome email to user
await resend.emails.send({
  from: 'El Atlas Studio <onboarding@resend.dev>',
  to: email,
  subject: 'Welcome to El Atlas Studio Insights!',
  html: `
    <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:32px;">
      <h2 style="color:#E8192C;">Welcome to El Atlas Studio!</h2>
      <p>Thanks for subscribing to our insights.</p>
      <p>You'll receive our latest updates and resources.</p>
      <p style="color:#666;">— El Atlas Studio Team</p>
    </div>
  `
});

// Notification email to admin
await resend.emails.send({
  from: 'El Atlas Studio <onboarding@resend.dev>',
  to: 'etlasstudio8@gmail.com',
  subject: `New Subscriber: ${email}`,
  html: `
    <div style="font-family:sans-serif;padding:20px;">
      <h2>New Subscriber 🎉</h2>
      <p><strong>${email}</strong> has subscribed.</p>
    </div>
  `
});

    res.status(201).json({ success: true, message: 'Subscribed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
