import Appointment from "../models/appointment.js";
import Service from "../models/service.js";
import Staff from "../models/staff.js";
import { asyncHandler, AppError } from "../middleware/errorhandler.js";

// GET all appointments (with pagination + filter)
// Customers see their own, staff see their own, owners see their salon's, admin sees all
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

  // Role-based filtering
  if (req.user.role === "customer") {
    filter.customerId = req.user._id;
  } else if (req.user.role === "staff" && req.staff) {
    filter.staffId = req.staff._id;
  } else if (req.user.role === "owner" && req.salon) {
    filter.salonId = req.salon._id;
  }
  // Admin sees all (no filter)

  // Status filtering - supports single value or comma-separated values
  if (status) {
    const statusArray = status.split(",").map((s) => s.trim());
    if (statusArray.length === 1) {
      filter.status = statusArray[0];
    } else {
      filter.status = { $in: statusArray };
    }
  }

  // ID-based filtering
  if (salonId) filter.salonId = salonId;
  if (serviceId) filter.serviceId = serviceId;
  if (staffId) filter.staffId = staffId;
  if (customerId && req.user.role !== "customer") filter.customerId = customerId;

  // Date range filtering
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) {
      filter.date.$gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.date.$lte = end;
    }
  }

  // Amount range filtering
  if (minAmount || maxAmount) {
    filter.amount = {};
    if (minAmount) filter.amount.$gte = Number(minAmount);
    if (maxAmount) filter.amount.$lte = Number(maxAmount);
  }

  // Text search in notes
  if (search) {
    const searchRegex = new RegExp(search, "i");
    if (Object.keys(filter).length > 0) {
      const combinedFilter = {
        $and: [
          { ...filter },
          { notes: searchRegex },
        ],
      };
      Object.keys(filter).forEach((key) => delete filter[key]);
      Object.assign(filter, combinedFilter);
    } else {
      filter.notes = searchRegex;
    }
  }

  // Validate sortBy field
  const allowedSortFields = ["date", "time", "amount", "status", "createdAt", "updatedAt"];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : "date";
  const sortDirection = sortOrder.toLowerCase() === "desc" ? -1 : 1;
  const sort = { [sortField]: sortDirection };
  if (sortField === "date") {
    sort.time = sortDirection; // Secondary sort by time when sorting by date
  }

  // Get total count with filters
  const total = await Appointment.countDocuments(filter);

  // Calculate pagination
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;
  const totalPages = Math.ceil(total / limitNum);

  // Fetch appointments with filters, sorting, and pagination
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
// Customers choose salon and service, staff is automatically assigned
export const createAppointment = asyncHandler(async (req, res) => {
  const { salonId, serviceId, date, time } = req.body;

  // Validate required fields (staffId is no longer required)
  if (!salonId || !serviceId || !date || !time) {
    throw new AppError("Please provide salonId, serviceId, date, and time", 400);
  }

  // Verify salon exists
  const Salon = (await import("../models/salon.js")).default;
  const salon = await Salon.findById(salonId);
  if (!salon) {
    throw new AppError("Salon not found", 404);
  }

  // Verify service exists
  const service = await Service.findById(serviceId);
  if (!service) {
    throw new AppError("Service not found", 404);
  }

  // Find available staff member who specializes in this service at this salon
  const staff = await Staff.findOne({
    salonId: salonId,
    specializations: serviceId,
  }).populate("specializations");

  if (!staff) {
    throw new AppError(
      "No staff member available for this service at this salon. Please contact the salon.",
      404
    );
  }

  // Calculate amount (service price - discount)
  const amount = service.price - (service.discount || 0);

  // Create appointment with automatically assigned staff
  const appointment = await Appointment.create({
    customerId: req.user._id,
    salonId,
    serviceId,
    staffId: staff._id,
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
