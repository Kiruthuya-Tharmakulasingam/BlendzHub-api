import express from "express";
import { getCompletedBookings } from "../controllers/appointmentController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Alias route for /bookings/completed (bookings and appointments are the same)
router.get("/completed", authenticate, getCompletedBookings);

export default router;

