import Appointment from "../models/appointment.js";
import Service from "../models/service.js";
import Staff from "../models/staff.js";
import { asyncHandler, AppError } from "../middleware/errorhandler.js";

// GET all appointments (with pagination + filter)
// Customers see their own, staff see their own, owners see their salon's, admin sees all
export const getAllAppointments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const filter = status ? { status } : {};

  // Role-based filtering
  if (req.user.role === "customer") {
    filter.customerId = req.user._id;
  } else if (req.user.role === "staff" && req.staff) {
    filter.staffId = req.staff._id;
  } else if (req.user.role === "owner" && req.salon) {
    filter.salonId = req.salon._id;
  }
  // Admin sees all (no filter)

  const total = await Appointment.countDocuments(filter);
  const appointments = await Appointment.find(filter)
    .populate("customerId", "name email")
    .populate("serviceId", "name price")
    .populate("salonId", "name location")
    .populate("staffId", "name role")
    .sort({ date: 1, time: 1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({ success: true, total, data: appointments });
});

// GET single appointment
export const getAppointmentById = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };

  // Role-based access control
  if (req.user.role === "customer") {
    filter.customerId = req.user._id;
  } else if (req.user.role === "staff" && req.staff) {
    filter.staffId = req.staff._id;
  } else if (req.user.role === "owner" && req.salon) {
    filter.salonId = req.salon._id;
  }
  // Admin can access any

  const appointment = await Appointment.findOne(filter)
    .populate("customerId", "name email")
    .populate("serviceId", "name price")
    .populate("salonId", "name location")
    .populate("staffId", "name role specializations");

  if (!appointment) {
    throw new AppError("Appointment not found", 404);
  }

  res.json({ success: true, data: appointment });
});

// CREATE appointment (customer booking)
export const createAppointment = asyncHandler(async (req, res) => {
  const { salonId, serviceId, staffId, date, time } = req.body;

  // Validate required fields
  if (!salonId || !serviceId || !staffId || !date || !time) {
    throw new AppError("Please provide salonId, serviceId, staffId, date, and time", 400);
  }

  // Verify staff specializes in this service
  const staff = await Staff.findById(staffId).populate("specializations");
  if (!staff) {
    throw new AppError("Staff member not found", 404);
  }

  const service = await Service.findById(serviceId);
  if (!service) {
    throw new AppError("Service not found", 404);
  }

  // Check if staff specializes in this service
  const hasSpecialization = staff.specializations.some(
    (spec) => spec._id.toString() === serviceId
  );
  if (!hasSpecialization) {
    throw new AppError(
      "This staff member does not specialize in the selected service",
      400
    );
  }

  // Verify staff belongs to the selected salon
  if (staff.salonId.toString() !== salonId) {
    throw new AppError("Staff member does not belong to the selected salon", 400);
  }

  // Calculate amount (service price - discount)
  const amount = service.price - (service.discount || 0);

  // Create appointment
  const appointment = await Appointment.create({
    customerId: req.user._id,
    salonId,
    serviceId,
    staffId,
    date,
    time,
    amount,
    status: "pending",
  });

  // Create notification for staff
  const Notification = (await import("../models/notification.js")).default;
  const staffUser = await import("../models/user.js").then(m => m.default.findById(staff.userId));
  if (staffUser) {
    await Notification.create({
      userId: staffUser._id,
      staffId: staff._id,
      type: "appointment_created",
      title: "New Appointment",
      message: `${req.user.name} has booked an appointment with you`,
      appointmentId: appointment._id,
    });
  }

  const populatedAppointment = await Appointment.findById(appointment._id)
    .populate("customerId", "name email")
    .populate("serviceId", "name price")
    .populate("salonId", "name location")
    .populate("staffId", "name role");

  res.status(201).json({
    success: true,
    message: "Appointment booked successfully. Staff will be notified.",
    data: populatedAppointment,
  });
});

// UPDATE appointment
export const updateAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  if (!appointment) throw new AppError("Appointment not found", 404);
  res.json({ success: true, data: appointment });
});

// DELETE appointment
export const deleteAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findByIdAndDelete(req.params.id);
  if (!appointment) throw new AppError("Appointment not found", 404);
  res.json({ success: true, message: "Appointment deleted successfully" });
});
