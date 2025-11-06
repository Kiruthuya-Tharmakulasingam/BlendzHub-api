import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  discount: { type: Number, default: 0 },
});

export default mongoose.model("Service", serviceSchema);
