import mongoose from "mongoose";

const salonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  type: { type: String, enum: ["men", "women", "unisex"], default: "unisex" },
});

export default mongoose.model("Salon", salonSchema);
