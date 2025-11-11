import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import equipmentRoutes from "./routes/equipmentRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import staffRoutes from "./routes/staffRoutes.js";
import salonRoutes from "./routes/salonRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

import errorHandler from "./middleware/errorhandler.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());

connectDB();

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Our App",
    debug: {
      hasJwtSecret: !!process.env.JWT_SECRET,
      jwtSecretLength: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0,
      hasMongoUri: !!process.env.MONGO_URI,
      nodeEnv: process.env.NODE_ENV,
      message: process.env.JWT_SECRET 
        ? "JWT_SECRET is set (length: " + process.env.JWT_SECRET.length + ")" 
        : "JWT_SECRET is NOT set - add it in Vercel Dashboard → Settings → Environment Variables"
    }
  });
});

// Debug endpoint to check environment variables
app.get("/api/debug/env", (req, res) => {
  res.json({
    hasJwtSecret: !!process.env.JWT_SECRET,
    jwtSecretLength: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0,
    hasMongoUri: !!process.env.MONGO_URI,
    nodeEnv: process.env.NODE_ENV,
    message: process.env.JWT_SECRET 
      ? "JWT_SECRET is set (length: " + process.env.JWT_SECRET.length + ")" 
      : "JWT_SECRET is NOT set - add it in Vercel Dashboard → Settings → Environment Variables"
  });
});

// Auth routes (public)
app.use("/api/auth", authRoutes);

// Admin routes (admin/owner only)
app.use("/api/admin", adminRoutes);

// Other routes
app.use("/api/customers", customerRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/equipments", equipmentRoutes);
app.use("/api/feedbacks", feedbackRoutes);
app.use("/api/products", productRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/staffs", staffRoutes);
app.use("/api/salons", salonRoutes);
app.use("/api/payments", paymentRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
