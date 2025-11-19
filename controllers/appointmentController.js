import Appointment from "../models/appointment.js";
import Service from "../models/service.js";
import Staff from "../models/staff.js";
import { asyncHandler, AppError } from "../middleware/errorhandler.js";

// -----------------------------
// GET all appointments
export const getAllAppointments = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    search,
    salonId,
    serviceId,
    staffId,
    customerId,
    sortBy = "date",
    sortOrder = "asc",
    startDate,
    endDate,
    minAmount,
    maxAmount,
  } = req.query;

  const filter = {};

  // Role-based filter
  if (req.user.role === "customer") filter.customerId = req.user._id;
  else if (req.user.role === "staff" && req.staff)
    filter.staffId = req.staff._id;
  else if (req.user.role === "owner" && req.salon)
    filter.salonId = req.salon._id;

  if (status) {
    const statusArray = status.split(",").map((s) => s.trim());
    filter.status =
      statusArray.length === 1 ? statusArray[0] : { $in: statusArray };
  }

  if (salonId) filter.salonId = salonId;
  if (serviceId) filter.serviceId = serviceId;
  if (staffId) filter.staffId = staffId;
  if (customerId && req.user.role !== "customer")
    filter.customerId = customerId;

  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.date.$lte = end;
    }
  }

  if (minAmount || maxAmount) {
    filter.amount = {};
    if (minAmount) filter.amount.$gte = Number(minAmount);
    if (maxAmount) filter.amount.$lte = Number(maxAmount);
  }

  if (search) filter.notes = new RegExp(search, "i");

  const allowedSortFields = [
    "date",
    "time",
    "amount",
    "status",
    "createdAt",
    "updatedAt",
  ];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : "date";
  const sortDirection = sortOrder.toLowerCase() === "desc" ? -1 : 1;
  const sort = { [sortField]: sortDirection };
  if (sortField === "date") sort.time = sortDirection;

  const total = await Appointment.countDocuments(filter);

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;
  const totalPages = Math.ceil(total / limitNum);

  const appointments = await Appointment.find(filter)
    .populate("customerId", "name email")
    .populate("serviceId", "name price")
    .populate("salonId", "name location")
    .populate("staffId", "name role")
    .sort(sort)
    .skip(skip)
    .limit(limitNum);

  res.json({
    success: true,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages,
    data: appointments,
  });
});

// -----------------------------
// GET single appointment
export const getAppointmentById = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };

  if (req.user.role === "customer") filter.customerId = req.user._id;
  else if (req.user.role === "staff" && req.staff)
    filter.staffId = req.staff._id;
  else if (req.user.role === "owner" && req.salon)
    filter.salonId = req.salon._id;

  const appointment = await Appointment.findOne(filter)
    .populate("customerId", "name email")
    .populate("serviceId", "name price")
    .populate("salonId", "name location")
    .populate("staffId", "name role specializations");

  if (!appointment) throw new AppError("Appointment not found", 404);

  res.json({ success: true, data: appointment });
});

// -----------------------------
// CREATE appointment (slot conflict check)
export const createAppointment = asyncHandler(async (req, res) => {
  const { salonId, serviceId, date, time } = req.body;

  if (!salonId || !serviceId || !date || !time) {
    throw new AppError(
      "Please provide salonId, serviceId, date, and time",
      400
    );
  }

  const Salon = (await import("../models/salon.js")).default;
  const salon = await Salon.findById(salonId);
  if (!salon) throw new AppError("Salon not found", 404);

  const service = await Service.findById(serviceId);
  if (!service) throw new AppError("Service not found", 404);

  const interval = 30;
  const blocksNeeded = Math.ceil(service.duration / interval);

  const { generateTimeSlots } = await import("../utils/generateSlots.js");
  const allSlots = generateTimeSlots("09:00", "18:00", interval);

  const startIndex = allSlots.indexOf(time);
  if (startIndex === -1 || startIndex + blocksNeeded > allSlots.length) {
    throw new AppError("Invalid start time or exceeds working hours", 400);
  }

  const covers = allSlots.slice(startIndex, startIndex + blocksNeeded);

  const availableStaff = await Staff.findOne({
    salonId,
    specializations: serviceId,
  });
  if (!availableStaff)
    throw new AppError(
      "No staff member available for this service at this salon. Please choose another time.",
      404
    );

  const conflict = await Appointment.findOne({
    staffId: availableStaff._id,
    date,
    time: { $in: covers },
    status: { $in: ["pending", "accepted", "in-progress"] }, // ignore completed/cancelled/no-show
  });
  if (conflict)
    throw new AppError(
      "Selected time slot is already booked. Please choose another.",
      400
    );

  const amount = service.price - (service.discount || 0);

  const appointment = await Appointment.create({
    customerId: req.user._id,
    salonId,
    serviceId,
    staffId: availableStaff._id,
    date,
    time,
    amount,
    status: "pending",
  });

  const populatedAppointment = await Appointment.findById(appointment._id)
    .populate("customerId", "name email")
    .populate("serviceId", "name price")
    .populate("salonId", "name location")
    .populate("staffId", "name role");

  res.status(201).json({
    success: true,
    message: "Appointment booked successfully.",
    data: populatedAppointment,
  });
});

// -----------------------------
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

// -----------------------------
// DELETE appointment
export const deleteAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findByIdAndDelete(req.params.id);
  if (!appointment) throw new AppError("Appointment not found", 404);
  res.json({ success: true, message: "Appointment deleted successfully" });
});

// -----------------------------
// MARK no-show
export const markNoShow = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) throw new AppError("Appointment not found", 404);

  appointment.status = "no-show";
  appointment.noShowAt = new Date();
  await appointment.save();

  res.json({
    success: true,
    message: "Appointment marked as no-show",
    data: appointment,
  });
});
