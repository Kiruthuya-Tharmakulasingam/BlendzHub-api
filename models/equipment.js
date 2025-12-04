import mongoose from "mongoose";

const equipmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["available", "in-use", "maintenance", "unavailable"],
      default: "available",
    },
    imageUrl: {
      type: String,
    },
    lastSterlizedDate: {
      type: Date,
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

export default mongoose.model("Equipment", equipmentSchema);
