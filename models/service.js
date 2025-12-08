import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    description: { type: String, trim: true },
    discount: { type: Number, default: 0 },

    // Add duration in minutes
    duration: { type: Number, required: true },
    imageUrl: { type: String },
    
    // Links
    // STRICT SALON ISOLATION: Each service belongs to ONE and ONLY ONE salon
    // salonId is required and indexed for performance and data integrity
    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Salon",
      required: true,
      index: true, // Index for fast queries and data integrity
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure fast queries by salonId
serviceSchema.index({ salonId: 1, createdAt: -1 });

export default mongoose.model("Service", serviceSchema);
