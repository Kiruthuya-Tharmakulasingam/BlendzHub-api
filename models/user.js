import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  contact: { type: String },
  role: {
    type: String,
    enum: ["customer", "staff", "admin"],
    default: "customer",
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("User", userSchema);
