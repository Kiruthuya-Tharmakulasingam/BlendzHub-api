import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  supplier: { type: String },
  qualityRating: { type: Number, min: 0, max: 5 },
});

export default mongoose.model("Product", productSchema);
