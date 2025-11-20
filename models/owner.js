import mongoose from "mongoose";

const ownerSchema = new mongoose.Schema(
  {
    // Link to User account (created after admin approval)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    name: {
      type: String,
      required: [true, "Please provide a name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    status: {
      type: String,
      enum: ["pending", "approved"],
      default: "pending",
    },
    // Additional owner-specific fields can be added here
    phone: {
      type: String,
    },
    businessName: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Owner", ownerSchema);
