import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
  dateTime: { type: Date, required: true },
  status: { type: String, default: "Pending" },
});

export default mongoose.model("Appointment", appointmentSchema);