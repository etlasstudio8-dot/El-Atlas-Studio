require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/database');

const seedAdmin = async () => {
  try {
    await connectDB();

    // Check if admin already exists
    const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL });

    if (adminExists) {
      console.log('✅ Admin user already exists');
      console.log('📧 Email:', adminExists.email);
      console.log('👤 Username:', adminExists.username);
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      name: 'Admin',
      email: process.env.ADMIN_EMAIL || 'alishafaq782@gmail.com',
      username: 'admin',
      password: 'admin123', // CHANGE THIS AFTER FIRST LOGIN!
      role: 'admin',
      permissions: ['all'],
      isActive: true
    });

    console.log('');
    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('╔═══════════════════════════════════════════╗');
    console.log('║         ADMIN LOGIN CREDENTIALS           ║');
    console.log('╠═══════════════════════════════════════════╣');
    console.log('║ Email:', admin.email.padEnd(33), '║');
    console.log('║ Username: admin                           ║');
    console.log('║ Password: admin123                        ║');
    console.log('╠═══════════════════════════════════════════╣');
    console.log('║ ⚠️  IMPORTANT: Change password after      ║');
    console.log('║    first login for security!              ║');
    console.log('╚═══════════════════════════════════════════╝');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error.message);
    process.exit(1);
  }
};

seedAdmin();
