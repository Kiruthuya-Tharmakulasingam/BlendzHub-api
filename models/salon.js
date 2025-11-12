import mongoose from "mongoose";

const salonSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  location: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ["men", "women", "unisex"], 
    default: "unisex" 
  },
  // Link to owner (User with role 'owner')
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  // Contact information
  phone: { type: String },
  email: { type: String },
  // Business hours (optional for MVP)
  openingHours: { type: String },
}, {
  timestamps: true,
});

export default mongoose.model("Salon", salonSchema);
