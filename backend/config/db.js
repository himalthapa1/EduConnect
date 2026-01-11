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
    console.error('Please ensure MongoDB is running and the URI is correct.');
    process.exit(1);
  }
};

export default connectDB;
