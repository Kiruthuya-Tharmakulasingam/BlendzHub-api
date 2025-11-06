import mongoose from "mongoose";

const staffSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, required: true },
  skillLevel: { type: String },
  trainingStatus: { type: String },
});

export default mongoose.model("Staff", staffSchema);
