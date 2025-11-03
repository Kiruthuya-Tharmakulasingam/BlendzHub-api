import mongoose from "mongoose";

const equipmentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  lastSterilizedDate: { type: Date, default: Date.now },
  status: { type: String, default: "Available" },
});

export default mongoose.model("Equipment", equipmentSchema);