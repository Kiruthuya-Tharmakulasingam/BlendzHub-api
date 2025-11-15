import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    description: { type: String, trim: true },
    discount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Service", serviceSchema);
