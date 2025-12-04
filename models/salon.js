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
  // Image
  imageUrl: { type: String },
  // Business hours (optional for MVP - keeping for backward compatibility)
  openingHours: { type: String },
  // Structured operating hours
  operatingHours: {
    monday: { open: String, close: String, closed: { type: Boolean, default: false } },
    tuesday: { open: String, close: String, closed: { type: Boolean, default: false } },
    wednesday: { open: String, close: String, closed: { type: Boolean, default: false } },
    thursday: { open: String, close: String, closed: { type: Boolean, default: false } },
    friday: { open: String, close: String, closed: { type: Boolean, default: false } },
    saturday: { open: String, close: String, closed: { type: Boolean, default: false } },
    sunday: { open: String, close: String, closed: { type: Boolean, default: true } },
  },
  // Booking settings
  bookingSettings: {
    minAdvanceBookingHours: { type: Number, default: 2 }, // Minimum hours in advance
    maxAdvanceBookingDays: { type: Number, default: 30 }, // Maximum days in advance
    slotInterval: { type: Number, default: 30 }, // Time slot interval in minutes
    allowSameDayBooking: { type: Boolean, default: true },
    cancellationHours: { type: Number, default: 24 }, // Hours before appointment for cancellation
  },
}, {
  timestamps: true,
});

export default mongoose.model("Salon", salonSchema);
