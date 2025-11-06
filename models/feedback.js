import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    comments: { type: String },
    rating: { type: Number, min: 1, max: 5 },
    salonId: { type: mongoose.Schema.Types.ObjectId, ref: "Salon" },
  },
  { timestamps: true }
);

export default mongoose.model("Feedback", feedbackSchema);
