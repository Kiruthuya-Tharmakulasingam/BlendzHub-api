import mongoose from "mongoose";

const staffSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  role: { type: String, required: true, trim: true },
  trainingStatus: { type: String, default: "In Progress" },
  skillLevel: { type: String, default: "Beginner" },
});

export default mongoose.model("Staff", staffSchema);