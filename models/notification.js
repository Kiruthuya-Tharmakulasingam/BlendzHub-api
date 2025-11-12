import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  // Recipient
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  // For staff notifications
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Staff",
    default: null,
  },
  // Notification type
  type: {
    type: String,
    enum: [
      "appointment_created",
      "appointment_accepted",
      "appointment_completed",
      "payment_received",
      "staff_approved",
      "staff_rejected",
      "feedback_received",
    ],
    required: true,
  },
  // Title and message
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  // Related entities
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Appointment",
    default: null,
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Payment",
    default: null,
  },
  // Read status
  isRead: {
    type: Boolean,
    default: false,
  },
  readAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

export default mongoose.model("Notification", notificationSchema);

