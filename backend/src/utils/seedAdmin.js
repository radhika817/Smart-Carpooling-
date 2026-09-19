import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.js';

dotenv.config();

export const runAdminSeed = async () => {
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@smartride.com').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';

    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      // Ensure role is admin and verified
      let changed = false;
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        changed = true;
      }
      if (!existingAdmin.verificationStatus?.govtId || !existingAdmin.verificationStatus?.email) {
        existingAdmin.set('verificationStatus.email', true);
        existingAdmin.set('verificationStatus.phone', true);
        existingAdmin.set('verificationStatus.organization', true);
        existingAdmin.set('verificationStatus.govtId', true);
        existingAdmin.markModified('verificationStatus');
        changed = true;
      }
      if (changed) {
        await existingAdmin.save();
        console.log(`🛡️ Admin role and verification refreshed for: ${adminEmail}`);
      } else {
        console.log(`🛡️ Admin account active and verified: ${adminEmail}`);
      }
      return existingAdmin;
    }

    // Check if any other admin exists
    const anyAdmin = await User.findOne({ role: 'admin' });
    if (anyAdmin) {
      return anyAdmin;
    }

    // Create initial superadmin
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    const adminUser = await User.create({
      name: 'System Administrator',
      email: adminEmail,
      passwordHash,
      phone: '+919999999999',
      organization: 'SmartRide Platform',
      role: 'admin',
      verificationStatus: {
        email: true,
        phone: true,
        organization: true,
        govtId: true,
      },
      preferences: {
        smoking: false,
        music: true,
        petFriendly: true,
        quietRide: false,
      },
    });

    console.log(`✅ Default administrator provisioned: ${adminEmail} (Role: admin)`);
    return adminUser;
  } catch (error) {
    console.warn('Admin seed notice:', error.message);
  }
};

// If run directly from CLI (e.g. node src/utils/seedAdmin.js)
if (process.argv[1] && process.argv[1].endsWith('seedAdmin.js')) {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smartride';
  console.log('Connecting to database for admin seeding...');
  mongoose
    .connect(uri)
    .then(async () => {
      await runAdminSeed();
      console.log('Seed execution completed.');
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch((err) => {
      console.error('Admin seeding failed:', err);
      process.exit(1);
    });
}
