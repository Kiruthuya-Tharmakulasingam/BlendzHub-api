import mongoose from "mongoose";

// Cache the database connection for serverless
let cachedConnection = null;
let connectionPromise = null;

const connectDB = async () => {
  // If already connected, return immediately
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log("Using cached database connection");
    console.log(`Database: ${mongoose.connection.db.databaseName}`);
    console.log(`Host: ${mongoose.connection.host}`);
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

    // Debug: Check if MONGO_URI is set
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI environment variable is not set!");
    }

    // Debug: Log connection string format (hide password)
    const sanitizedUri = process.env.MONGO_URI.replace(
      /mongodb\+srv:\/\/([^:]+):([^@]+)@/,
      "mongodb+srv://$1:****@"
    );
    console.log(`Connecting to: ${sanitizedUri}`);

    connectionPromise = mongoose.connect(process.env.MONGO_URI, {
      bufferCommands: true, // Allow buffering for serverless
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    cachedConnection = await connectionPromise;

    // Log successful connection details
    console.log(`DB Connected Successfully!`);
    console.log(`Host: ${cachedConnection.connection.host}`);
    console.log(`Database: ${cachedConnection.connection.db.databaseName}`);
    console.log(`Connection State: ${mongoose.connection.readyState}`);

    return cachedConnection;
  } catch (error) {
    console.error("DB Connection Error:", error.message);
    console.error("Full Error:", error);
    connectionPromise = null; // Reset on error so next request can retry
    throw new Error(`Database connection failed: ${error.message}`);
  }
};

export default connectDB;
