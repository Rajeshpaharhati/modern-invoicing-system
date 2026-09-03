const mongoose = require('mongoose');

let mongoServerInstance = null;

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState >= 1) {
      return mongoose.connection;
    }

    let mongoUri = process.env.MONGODB_URI;

    if (mongoUri && mongoUri.trim() !== '') {
      console.log(`[Database] Connecting to configured MongoDB: ${mongoUri.split('@').pop()}`);
      await mongoose.connect(mongoUri);
      console.log('[Database] Successfully connected to configured MongoDB');
    } else {
      console.log('[Database] No MONGODB_URI provided. Starting zero-config MongoMemoryServer...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoServerInstance = await MongoMemoryServer.create();
      mongoUri = mongoServerInstance.getUri();
      await mongoose.connect(mongoUri);
      console.log('[Database] Connected to In-Memory MongoDB (Zero-Config review mode)');
    }

    mongoose.connection.on('error', (err) => {
      console.error('[Database] MongoDB connection runtime error:', err);
    });

    return mongoose.connection;
  } catch (error) {
    console.error('[Database] MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongoServerInstance) {
      await mongoServerInstance.stop();
    }
  } catch (error) {
    console.error('[Database] Disconnect error:', error);
  }
};

module.exports = { connectDB, disconnectDB };
