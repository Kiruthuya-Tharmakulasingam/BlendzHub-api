import Appointment from "../models/appointment.js";
import asyncHandler from "../middleware/asyncHandler.js";

// GET all appointments (with pagination + filter)
export const getAllAppointments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const filter = status ? { status } : {};
  const total = await Appointment.countDocuments(filter);

  const appointments = await Appointment.find(filter)
    .populate("customerId", "name email contact")
    .populate("serviceId", "name price")
    .populate("salonId", "name location")
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({ success: true, total, data: appointments });
});

// GET single appointment
export const getAppointmentById = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id).populate(
    "customerId salonId serviceId"
  );
  if (!appointment) throw new Error("Appointment not found");
  res.json({ success: true, data: appointment });
});

// CREATE appointment
export const createAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.create(req.body);
  res.status(201).json({ success: true, data: appointment });
});

// UPDATE appointment
export const updateAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  if (!appointment) throw new Error("Appointment not found");
  res.json({ success: true, data: appointment });
});

// DELETE appointment
export const deleteAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findByIdAndDelete(req.params.id);
  if (!appointment) throw new Error("Appointment not found");
  res.json({ success: true, message: "Appointment deleted successfully" });
});
