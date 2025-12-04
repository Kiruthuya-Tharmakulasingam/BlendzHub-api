import Appointment from "../models/appointment.js";
import Service from "../models/service.js";
import Salon from "../models/salon.js";
import { generateTimeSlots } from "../utils/generateSlots.js";
import mongoose from "mongoose";

export const getAvailableSlots = async (req, res) => {
  try {
    const { date, serviceId, salonId } = req.query;

    if (!date || !serviceId) {
      return res.status(400).json({ message: "date, serviceId required" });
    }

    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({ message: "Invalid serviceId" });
    }

    if (!salonId || !mongoose.Types.ObjectId.isValid(salonId)) {
      return res.status(400).json({ message: "salonId is required" });
    }

    console.log("Slot request:", { date, serviceId, salonId });

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    const salon = await Salon.findById(salonId);
    if (!salon) {
      return res.status(404).json({ message: "Salon not found" });
    }

    // Check if date is valid
    const queryDate = new Date(date);
    if (isNaN(queryDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    queryDate.setHours(0, 0, 0, 0);

    // Check if date is in the past
    if (queryDate < today) {
      return res.status(400).json({ message: "Cannot book appointments in the past" });
    }

    // Get booking settings
    const bookingSettings = salon.bookingSettings || {
      minAdvanceBookingHours: 2,
      maxAdvanceBookingDays: 30,
      slotInterval: 30,
      allowSameDayBooking: true,
    };

    // Check maximum advance booking
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + bookingSettings.maxAdvanceBookingDays);
    if (queryDate > maxDate) {
      return res.status(400).json({ 
        message: `Cannot book more than ${bookingSettings.maxAdvanceBookingDays} days in advance` 
      });
    }

    // Check minimum advance booking
    if (!bookingSettings.allowSameDayBooking && queryDate.getTime() === today.getTime()) {
      return res.status(400).json({ message: "Same-day booking is not allowed" });
    }

    // Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const dayOfWeek = queryDate.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];

    // Get operating hours for the day
    let opening = "09:00";
    let closing = "18:00";
    
    // Check if salon has operating hours configured
    const operatingHours = salon.operatingHours;
    
    // Only check operating hours if they exist and are properly structured
    if (operatingHours && typeof operatingHours === 'object' && Object.keys(operatingHours).length > 0) {
      const dayHours = operatingHours[dayName];
      
      // If salon has operating hours configured for this day, check if closed
      if (dayHours && typeof dayHours === 'object') {
        if (dayHours.closed === true) {
          return res.status(400).json({ message: `Salon is closed on ${dayName}` });
        }
        // Use configured hours if available
        if (dayHours.open && typeof dayHours.open === 'string') opening = dayHours.open;
        if (dayHours.close && typeof dayHours.close === 'string') closing = dayHours.close;
      }
      // If no dayHours configured for this day, use defaults (salon might be open)
    }
    // If no operatingHours at all or empty object, use default hours (backward compatibility)
    
    console.log(`Using hours for ${dayName}: ${opening} - ${closing}`);

    const duration = service.duration;
    if (!duration || duration <= 0) {
      return res.status(400).json({ message: "Invalid service duration" });
    }

    const interval = bookingSettings.slotInterval || 30;
    const blocksNeeded = Math.ceil(duration / interval);

    const allSlots = generateTimeSlots(opening, closing, interval);

    // Check minimum advance booking hours for same-day bookings
    if (queryDate.getTime() === today.getTime() && bookingSettings.minAdvanceBookingHours > 0) {
      const now = new Date();
      const minBookingTime = new Date(now.getTime() + bookingSettings.minAdvanceBookingHours * 60 * 60 * 1000);
      const minBookingHour = minBookingTime.getHours();
      const minBookingMinute = minBookingTime.getMinutes();
      const minBookingTimeStr = `${String(minBookingHour).padStart(2, '0')}:${String(minBookingMinute).padStart(2, '0')}`;
      
      // Filter out slots before minimum booking time
      const filteredSlots = allSlots.filter(slot => slot >= minBookingTimeStr);
      if (filteredSlots.length === 0) {
        return res.json({ 
          slots: [],
          message: `No available slots. Minimum advance booking is ${bookingSettings.minAdvanceBookingHours} hours.` 
        });
      }
    }

    const nextDay = new Date(queryDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const appointmentFilter = {
      date: {
        $gte: queryDate,
        $lt: nextDay,
      },
      status: { $in: ["pending", "accepted", "in-progress"] },
      salonId: new mongoose.Types.ObjectId(salonId),
    };

    const booked = await Appointment.find(appointmentFilter);

    const bookedTimes = booked.map((b) => b.time);

    const availableSlots = [];

    for (let i = 0; i <= allSlots.length - blocksNeeded; i++) {
      const needed = allSlots.slice(i, i + blocksNeeded);

      const isBlocked = needed.some((slot) => bookedTimes.includes(slot));
      if (isBlocked) continue;

      // Check minimum advance booking for same-day
      if (queryDate.getTime() === today.getTime() && bookingSettings.minAdvanceBookingHours > 0) {
        const now = new Date();
        const minBookingTime = new Date(now.getTime() + bookingSettings.minAdvanceBookingHours * 60 * 60 * 1000);
        const slotTime = new Date(queryDate);
        const [slotHour, slotMinute] = needed[0].split(":").map(Number);
        slotTime.setHours(slotHour, slotMinute, 0, 0);
        
        if (slotTime < minBookingTime) continue;
      }

      availableSlots.push({
        start: needed[0],
        end: needed[needed.length - 1],
        covers: needed,
      });
    }

    res.json({ slots: availableSlots });
  } catch (err) {
    console.error("Error in getAvailableSlots:", err);
    res.status(500).json({ 
      message: err.message || "Internal server error",
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};
