import mongoose from 'mongoose';

let mongod = null;

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  const uri = process.env.MONGODB_URI;

  try {
    if (uri && uri.trim() !== '') {
      console.log('Connecting to MongoDB Atlas / External URI...');
      await mongoose.connect(uri);
      console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
      return;
    }

    // Fallback in development/test when no URI is provided
    if (!mongod) {
      console.log('No MONGODB_URI provided in environment. Initializing local MongoDB Memory Server...');
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongod = await MongoMemoryServer.create();
    }
    const memoryUri = mongod.getUri();

    await mongoose.connect(memoryUri);
    console.log(`✅ Local In-Memory MongoDB Connected at: ${memoryUri}`);
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    throw error;
  }
};

export const disconnectDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongod) {
      await mongod.stop();
      mongod = null;
    }
    console.log('MongoDB disconnected.');
  } catch (error) {
    console.error('Error disconnecting MongoDB:', error);
  }
};
