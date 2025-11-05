import Appointment from "../models/appointment.js";
import asyncHandler from "../middleware/asyncHandler.js";
import { paginate } from "../utils/paginate.js";

// Get all appointments
export const getAllAppointments = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const result = await paginate(Appointment, page, limit, [
    { path: "customerId", model: "Customer" },
    { path: "staffId", model: "Staff" },
    { path: "serviceId", model: "Service" },
  ]);

  res.status(200).json({
    success: true,
    message: "Appointments fetched successfully",
    ...result,
  });
});

export const getAppointmentById = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id).populate(
    "customerId staffId serviceId"
  );
  if (!appointment)
    return res.status(404).json({ error: "Appointment not found" });
  res.status(200).json(appointment);
});

export const createAppointment = asyncHandler(async (req, res) => {
  const newAppointment = new Appointment(req.body);
  const saved = await newAppointment.save();
  res.status(201).json({ message: "Appointment created", appointment: saved });
});

export const updateAppointment = asyncHandler(async (req, res) => {
  const updated = await Appointment.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!updated) return res.status(404).json({ error: "Appointment not found" });
  res
    .status(200)
    .json({ message: "Appointment updated", appointment: updated });
});

export const deleteAppointment = asyncHandler(async (req, res) => {
  const deleted = await Appointment.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ error: "Appointment not found" });
  res
    .status(200)
    .json({ message: "Appointment deleted", appointment: deleted });
});
