import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import { Vehicle } from '../models/Vehicle.js';

dotenv.config();

/**
 * Upsert a user account with guaranteed credentials and verified status.
 */
const upsertAccount = async ({
  name,
  email,
  password,
  role = 'passenger',
  phone = '+919876543210',
  organization = 'MIT World Peace University / SmartRide Campus',
  preferences = { smoking: false, music: true, petFriendly: true, quietRide: false },
}) => {
  const normalizedEmail = email.toLowerCase().trim();
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  let user = await User.findOne({ email: normalizedEmail });

  if (user) {
    user.name = name;
    user.role = role;
    user.passwordHash = passwordHash;
    user.phone = phone || user.phone;
    user.organization = organization || user.organization;
    user.isSuspended = false;
    user.set('verificationStatus.email', true);
    user.set('verificationStatus.phone', true);
    user.set('verificationStatus.organization', true);
    user.set('verificationStatus.govtId', true);
    user.markModified('verificationStatus');
    await user.save();
    return user;
  }

  user = await User.create({
    name,
    email: normalizedEmail,
    passwordHash,
    phone,
    organization,
    role,
    isSuspended: false,
    verificationStatus: {
      email: true,
      phone: true,
      organization: true,
      govtId: true,
    },
    preferences,
  });

  return user;
};

/**
 * Ensure the demo driver has at least one registered vehicle.
 */
const ensureDriverVehicle = async (driverUser) => {
  if (!driverUser || driverUser.role !== 'driver') return;

  const existingVehicle = await Vehicle.findOne({ owner: driverUser._id });
  if (!existingVehicle) {
    await Vehicle.create({
      owner: driverUser._id,
      model: 'Tata Nexon EV',
      registrationNumber: 'MH 12 SR 2026',
      type: 'suv',
      seats: 4,
      image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80',
    });
    console.log(`🚗 Registered default vehicle for demo driver (${driverUser.email})`);
  }
};

export const runAdminSeed = async () => {
  try {
    const defaultPassword = 'DemoPass123!';

    // 1. System Administrator
    const envAdminEmail = (process.env.ADMIN_EMAIL || 'admin@smartride.com').toLowerCase().trim();
    const envAdminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';

    const adminUser = await upsertAccount({
      name: 'System Administrator',
      email: envAdminEmail,
      password: envAdminPassword,
      role: 'admin',
      phone: '+919999999999',
      organization: 'SmartRide Platform Headquarters',
    });
    console.log(`🛡️ Admin account verified: ${envAdminEmail}`);

    // Also seed a dedicated demo admin for easy testing
    await upsertAccount({
      name: 'SmartRide Demo Admin',
      email: 'demo.admin@smartride.edu',
      password: defaultPassword,
      role: 'admin',
      phone: '+919999999998',
      organization: 'SmartRide Operations Admin',
    });
    console.log(`🛡️ Demo admin ready: demo.admin@smartride.edu (Password: ${defaultPassword})`);

    // 2. Demo Passenger (primary: demo.passenger@smartride.edu, alias: passenger.demo@smartride.edu)
    const demoPassenger = await upsertAccount({
      name: 'Priya Sharma (Demo Passenger)',
      email: 'demo.passenger@smartride.edu',
      password: defaultPassword,
      role: 'passenger',
      phone: '+919876543210',
      organization: 'MIT World Peace University',
    });
    console.log(`👤 Demo passenger ready: demo.passenger@smartride.edu (Password: ${defaultPassword})`);

    // Alias for backwards compatibility
    await upsertAccount({
      name: 'Priya Sharma (Demo Passenger)',
      email: 'passenger.demo@smartride.edu',
      password: defaultPassword,
      role: 'passenger',
      phone: '+919876543210',
      organization: 'MIT World Peace University',
    });

    // 3. Demo Driver (primary: demo.driver@smartride.edu, alias: driver.demo@smartride.edu)
    const demoDriver = await upsertAccount({
      name: 'Rahul Deshmukh (Demo Driver)',
      email: 'demo.driver@smartride.edu',
      password: defaultPassword,
      role: 'driver',
      phone: '+919876543211',
      organization: 'MIT World Peace University',
    });
    await ensureDriverVehicle(demoDriver);
    console.log(`🚘 Demo driver ready: demo.driver@smartride.edu (Password: ${defaultPassword})`);

    // Alias for backwards compatibility
    const aliasDriver = await upsertAccount({
      name: 'Rahul Deshmukh (Demo Driver)',
      email: 'driver.demo@smartride.edu',
      password: defaultPassword,
      role: 'driver',
      phone: '+919876543211',
      organization: 'MIT World Peace University',
    });
    await ensureDriverVehicle(aliasDriver);

    console.log('✅ All demo accounts and vehicles provisioned successfully.');
    return adminUser;
  } catch (error) {
    console.warn('Account seeding warning:', error.message);
  }
};

// If run directly from CLI (e.g. node src/utils/seedAdmin.js)
if (process.argv[1] && process.argv[1].endsWith('seedAdmin.js')) {
  console.log('Connecting to database for account seeding...');
  const { connectDB, disconnectDB } = await import('./db.js');
  connectDB()
    .then(async () => {
      await runAdminSeed();
      console.log('Seed execution completed.');
      await disconnectDB();
      process.exit(0);
    })
    .catch((err) => {
      console.error('Account seeding failed:', err);
      process.exit(1);
    });
}
