import mongoose from "mongoose";

// Cache the database connection for serverless
let cachedConnection = null;
let connectionPromise = null;

const connectDB = async () => {
  // If already connected, return immediately
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log("Using cached database connection");
    return cachedConnection;
  }

  // If connection is in progress, wait for it
  if (connectionPromise) {
    console.log("Waiting for existing connection attempt");
    return connectionPromise;
  }

  // Start new connection
  try {
    console.log("Establishing new database connection...");
    connectionPromise = mongoose.connect(process.env.MONGO_URI, {
      bufferCommands: true, // Allow buffering for serverless
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    cachedConnection = await connectionPromise;
    console.log(`DB Connected Successfully! Host: ${cachedConnection.connection.host}`);
    
    return cachedConnection;
  } catch (error) {
    console.error("DB Connection Error:", error.message);
    connectionPromise = null; // Reset on error so next request can retry
    throw new Error(`Database connection failed: ${error.message}`);
  }
};

export default connectDB;