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
import equipmentRoutes from "./routes/equipmentRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import salonRoutes from "./routes/salonRoutes.js";
import slotRoutes from "./routes/slotRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

import errorHandler from "./middleware/errorhandler.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT;

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        "http://localhost:3000",
        "http://localhost:5173",
        /\.vercel\.app$/, // Allow all Vercel deployments
      ];
      
      const isAllowed = allowedOrigins.some(allowed => {
        if (allowed instanceof RegExp) {
          return allowed.test(origin);
        }
        return allowed === origin;
      });
      
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
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
app.get("/api/debug/env", (req, res) => {
  res.json({
    hasJwtSecret: !!process.env.JWT_SECRET,
    jwtSecretLength: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0,
    hasMongoUri: !!process.env.MONGO_URI,
    nodeEnv: process.env.NODE_ENV,
    message: process.env.JWT_SECRET
      ? "JWT_SECRET is set (length: " + process.env.JWT_SECRET.length + ")"
      : "JWT_SECRET is NOT set - add it in Vercel Dashboard → Settings → Environment Variables",
  });
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
app.use("/api/equipments", equipmentRoutes);
app.use("/api/feedbacks", feedbackRoutes);
app.use("/api/products", productRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/salons", salonRoutes);
app.use("/api/slots", slotRoutes);
app.use("/api/notifications", notificationRoutes);

app.use(errorHandler);

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT_LOCAL = PORT || 5000;
  // Connect to DB immediately on startup for local dev
  connectDB().then(() => {
    app.listen(PORT_LOCAL, () => {
      console.log(`Server running on port ${PORT_LOCAL}`);
    });
  }).catch(err => {
    console.error("Failed to connect to DB on startup:", err);
    process.exit(1);
  });
}

// Export for Vercel serverless functions
export default app;
