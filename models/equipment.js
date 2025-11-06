import mongoose from "mongoose";

const equipmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  status: { type: String, default: "available" },
  lastSterlizedDate: { type: Date },
});

export default mongoose.model("Equipment", equipmentSchema);
