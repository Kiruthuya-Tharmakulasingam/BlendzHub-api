import Appointment from "../models/appointment.js";
import Service from "../models/service.js";
import { generateTimeSlots } from "../utils/generateSlots.js";
import mongoose from "mongoose";

export const getAvailableSlots = async (req, res) => {
  try {
    const { date, serviceId } = req.query;

    if (!date || !serviceId) {
      return res.status(400).json({ message: "date, serviceId required" });
    }

    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({ message: "Invalid serviceId" });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    const duration = service.duration;
    if (!duration || duration <= 0) {
      return res.status(400).json({ message: "Invalid service duration" });
    }

    const interval = 30;
    const blocksNeeded = Math.ceil(duration / interval);

    const opening = "09:00";
    const closing = "18:00";

    const allSlots = generateTimeSlots(opening, closing, interval);

    const booked = await Appointment.find({ date });

    const bookedTimes = booked.map((b) => {
      const t = new Date(b.time);
      return (
        t.getHours().toString().padStart(2, "0") +
        ":" +
        t.getMinutes().toString().padStart(2, "0")
      );
    });

    const availableSlots = [];

    for (let i = 0; i <= allSlots.length - blocksNeeded; i++) {
      const needed = allSlots.slice(i, i + blocksNeeded);

      const isBlocked = needed.some((slot) => bookedTimes.includes(slot));
      if (isBlocked) continue;

      availableSlots.push({
        start: needed[0],
        end: needed[needed.length - 1],
        covers: needed,
      });
    }

    res.json({ slots: availableSlots });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};
