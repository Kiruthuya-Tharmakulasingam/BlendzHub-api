import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  supplier: { 
    type: String 
  },
  qualityRating: { 
    type: Number, 
    min: 0, 
    max: 5 
  },
  // Links
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Salon",
    required: true,
  },
  // Assigned to staff (optional)
  assignedToStaffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Staff",
    default: null,
  },
}, {
  timestamps: true,
});

export default mongoose.model("Product", productSchema);
