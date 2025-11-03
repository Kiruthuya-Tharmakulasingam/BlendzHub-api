import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  supplier: { type: String, trim: true },
  qualityRating: { type: Number, min: 1, max: 5 },
});

export default mongoose.model("Product", productSchema);
