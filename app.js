import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser"; // Added this import
import connectDB from "./config/db.js";

// Import models to ensure they're registered with Mongoose
import "./models/user.js";
import "./models/owner.js";
import "./models/customer.js";
import "./models/salon.js";
import "./models/notification.js";

import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import ownerRoutes from "./routes/ownerRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import bookingsRoutes from "./routes/bookingsRoutes.js";
import equipmentRoutes from "./routes/equipmentRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import salonRoutes from "./routes/salonRoutes.js";
import slotRoutes from "./routes/slotRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";

import errorHandler from "./middleware/errorhandler.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT;

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://blendzhub.vercel.app",
  "https://blendzhub-api.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("CORS Blocked:", origin);
      return callback(null, false);
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser()); // Added this middleware

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Our App",
    debug: {
      hasJwtSecret: !!process.env.JWT_SECRET,
      jwtSecretLength: process.env.JWT_SECRET
        ? process.env.JWT_SECRET.length
        : 0,
      hasMongoUri: !!process.env.MONGO_URI,
      nodeEnv: process.env.NODE_ENV,
      message: process.env.JWT_SECRET
        ? "JWT_SECRET is set (length: " + process.env.JWT_SECRET.length + ")"
        : "JWT_SECRET is NOT set - add it in Vercel Dashboard → Settings → Environment Variables",
    },
  });
});

// Debug endpoint to check environment variables
app.get("/api/debug/env", async (req, res) => {
  try {
    await connectDB();
    const mongoose = await import("mongoose");

    res.json({
      hasJwtSecret: !!process.env.JWT_SECRET,
      jwtSecretLength: process.env.JWT_SECRET
        ? process.env.JWT_SECRET.length
        : 0,
      hasMongoUri: !!process.env.MONGO_URI,
      nodeEnv: process.env.NODE_ENV,
      dbConnectionState: mongoose.default.connection.readyState,
      dbName: mongoose.default.connection.db?.databaseName || "Not connected",
      dbHost: mongoose.default.connection.host || "Not connected",
      message: process.env.JWT_SECRET
        ? "JWT_SECRET is set (length: " + process.env.JWT_SECRET.length + ")"
        : "JWT_SECRET is NOT set - add it in Vercel Dashboard → Settings → Environment Variables",
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to connect to database",
      message: error.message,
    });
  }
});

// Debug endpoint to check salon data directly
app.get("/api/debug/salons", async (req, res) => {
  try {
    await connectDB();
    const mongoose = await import("mongoose");
    const Salon =
      mongoose.default.models.Salon ||
      (await import("./models/salon.js")).default;

    const count = await Salon.countDocuments();
    const salons = await Salon.find().limit(5);

    res.json({
      dbName: mongoose.default.connection.db?.databaseName,
      collectionName: "salons",
      totalSalons: count,
      sampleSalons: salons.map((s) => ({
        id: s._id,
        name: s.name,
        location: s.location,
        type: s.type,
      })),
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch salons",
      message: error.message,
      stack: error.stack,
    });
  }
});

// Middleware to ensure database connection before handling requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Database connection failed:", error);
    res.status(500).json({
      success: false,
      message: "Database connection error. Please try again later.",
    });
  }
});

// Auth routes (public)
app.use("/api/auth", authRoutes);

// Profile routes (authenticated users)
app.use("/api/profile", profileRoutes);

// Admin routes (admin only)
app.use("/api/admin", adminRoutes);

// Owner routes (entity-based)
app.use("/api/owners", ownerRoutes);

// Entity routes
app.use("/api/customers", customerRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/equipments", equipmentRoutes);
app.use("/api/feedbacks", feedbackRoutes);
app.use("/api/products", productRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/salons", salonRoutes);
app.use("/api/slots", slotRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api", uploadRoutes);

app.use(errorHandler);

// For local development
if (process.env.NODE_ENV !== "production") {
  const PORT_LOCAL = PORT || 5000;
  // Connect to DB immediately on startup for local dev
  connectDB()
    .then(() => {
      app.listen(PORT_LOCAL, () => {
        console.log(`Server running on port ${PORT_LOCAL}`);
      });
    })
    .catch((err) => {
      console.error("Failed to connect to DB on startup:", err);
      process.exit(1);
    });
}

// Export for Vercel serverless functions
export default app;
