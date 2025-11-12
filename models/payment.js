import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  date: { 
    type: Date, 
    required: true 
  },
  method: { 
    type: String, 
    enum: ["cash", "card", "online"], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ["pending", "completed", "failed", "refunded"],
    default: "pending" 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  // Links
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Appointment",
    required: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Staff",
    required: true,
  },
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Salon",
    required: true,
  },
}, {
  timestamps: true,
});

export default mongoose.model("Payment", paymentSchema);
