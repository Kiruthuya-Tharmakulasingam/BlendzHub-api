import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  method: { type: String, enum: ["cash", "card", "online"], required: true },
  status: { type: String, default: "pending" },
  amount: { type: Number, required: true },
});

export default mongoose.model("Payment", paymentSchema);
