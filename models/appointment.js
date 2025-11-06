import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    status: { type: String, default: "pending" },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    salonId: { type: mongoose.Schema.Types.ObjectId, ref: "Salon" },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
    time: { type: String, required: true },
    amount: { type: Number, required: true },
    discount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Appointment", appointmentSchema);
