import dotenv from 'dotenv';
import { connectDB, disconnectDB } from './db.js';
import { User } from '../models/User.js';

dotenv.config();

export const runVerificationMigration = async () => {
  console.log('🔄 Checking & migrating verificationStatus fields across all users...');

  // Retroactively add missing verificationStatus fields
  const resGovtId = await User.updateMany(
    { 'verificationStatus.govtId': { $exists: false } },
    { $set: { 'verificationStatus.govtId': false } }
  );

  const resEmail = await User.updateMany(
    { 'verificationStatus.email': { $exists: false } },
    { $set: { 'verificationStatus.email': false } }
  );

  const resPhone = await User.updateMany(
    { 'verificationStatus.phone': { $exists: false } },
    { $set: { 'verificationStatus.phone': false } }
  );

  const resOrg = await User.updateMany(
    { 'verificationStatus.organization': { $exists: false } },
    { $set: { 'verificationStatus.organization': false } }
  );

  console.log(`✅ Verification migration complete:
  - Added govtId to ${resGovtId.modifiedCount} user(s)
  - Added email to ${resEmail.modifiedCount} user(s)
  - Added phone to ${resPhone.modifiedCount} user(s)
  - Added organization to ${resOrg.modifiedCount} user(s)`);
};

// Run standalone if executed directly
if (process.argv[1]?.endsWith('migrateVerificationStatus.js')) {
  (async () => {
    try {
      await connectDB();
      await runVerificationMigration();
      const users = await User.find({}).lean();
      console.log('\n--- VERIFYING ALL USERS IN ATLAS ---');
      users.forEach((u) => {
        console.log(u.email, '-> verificationStatus:', JSON.stringify(u.verificationStatus));
      });
    } finally {
      await disconnectDB();
    }
  })();
}
