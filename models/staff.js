import mongoose from "mongoose";

const staffSchema = new mongoose.Schema(
  {
    // Link to User account
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    // Link to Salon
    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Salon",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    skillLevel: {
      type: String,
    },
    trainingStatus: {
      type: String,
    },
    // Approval status by owner
    isApprovedByOwner: {
      type: Boolean,
      default: false,
    },
    approvedByOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Owner who approved
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Staff", staffSchema);
