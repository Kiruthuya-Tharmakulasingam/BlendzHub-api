import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "out-of-stock", "discontinued"],
      default: "active",
    },
    category: {
      type: String,
    },
    imageUrl: {
      type: String,
    },
    supplier: {
      type: String,
    },
    qualityRating: {
      type: Number,
      min: 0,
      max: 5,
    },
    // Links
    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Salon",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Product", productSchema);
