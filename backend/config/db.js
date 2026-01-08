import mongoose from 'mongoose';

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  try {
    if (!uri) throw new Error('MONGODB_URI not set');
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Connection state: ${conn.connection.readyState}`); // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
    console.log(`DB name: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB at ${uri}: ${error.message}`);

    // Development fallback: start an in-memory MongoDB when not in production
    if (process.env.NODE_ENV !== 'production') {
      try {
        console.warn('Falling back to in-memory MongoDB (development only)...');
        // Dynamically import to avoid requiring devDependency in production
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        const memUri = mongod.getUri();
        const conn = await mongoose.connect(memUri);
        console.log(`In-memory MongoDB started at ${memUri}`);
        // Keep reference for potential shutdown in other parts of the app/tests
        process.__MONGO_SERVER__ = mongod;  
        console.log(`MongoDB Connected (in-memory): ${conn.connection.host}`);
        return conn;
      } catch (memErr) {
        console.error(`Failed to start in-memory MongoDB: ${memErr.message}`);
        process.exit(1);
      }
    }

    // In production, exit with error
    process.exit(1);
  }
};

export default connectDB;
