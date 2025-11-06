import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  contact: { type: Number, required: true },
  status: { type: String, default: "active" },
});

export default mongoose.model("Customer", customerSchema);
