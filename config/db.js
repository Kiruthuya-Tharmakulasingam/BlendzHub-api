import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("DB Connected Successfully!");
  } catch (error) {
    console.error("DB Connection Error:", error.message);
  }
};

export default connectDB;