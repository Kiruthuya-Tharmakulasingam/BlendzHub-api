import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comments: { type: String, trim: true },
});

export default mongoose.model("Feedback", feedbackSchema);