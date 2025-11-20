import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Prevent Mongoose from buffering commands when not connected
      bufferCommands: false,
      // Increase timeout for slow connections
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(`DB Connected Successfully! Host: ${conn.connection.host}`);
  } catch (error) {
    console.error("DB Connection Error:", error.message);
    process.exit(1);
  }
};

export default connectDB;