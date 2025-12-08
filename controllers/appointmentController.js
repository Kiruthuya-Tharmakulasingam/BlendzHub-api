import Appointment from "../models/appointment.js";
import Service from "../models/service.js";
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
  else if (req.user.role === "owner" && req.salon)
    filter.salonId = req.salon._id;

  if (status) {
    const statusArray = status.split(",").map((s) => s.trim());
    filter.status =
      statusArray.length === 1 ? statusArray[0] : { $in: statusArray };
  }

  if (salonId) filter.salonId = salonId;
  if (serviceId) filter.serviceId = serviceId;
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
  else if (req.user.role === "owner" && req.salon)
    filter.salonId = req.salon._id;

  const appointment = await Appointment.findOne(filter)
    .populate("customerId", "name email")
    .populate("serviceId", "name price")
    .populate("salonId", "name location");

  if (!appointment) throw new AppError("Appointment not found", 404);

  res.json({ success: true, data: appointment });
});

// -----------------------------
// CREATE appointment (slot conflict check)
export const createAppointment = asyncHandler(async (req, res) => {
  const { salonId, serviceId, date, time, notes } = req.body;

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

  // Validate date
  const appointmentDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  appointmentDate.setHours(0, 0, 0, 0);

  if (appointmentDate < today) {
    throw new AppError("Cannot book appointments in the past", 400);
  }

  // Check booking restrictions
  const bookingSettings = salon.bookingSettings || {
    minAdvanceBookingHours: 2,
    maxAdvanceBookingDays: 30,
    slotInterval: 30,
    allowSameDayBooking: true,
  };

  // Check maximum advance booking
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + bookingSettings.maxAdvanceBookingDays);
  if (appointmentDate > maxDate) {
    throw new AppError(
      `Cannot book more than ${bookingSettings.maxAdvanceBookingDays} days in advance`,
      400
    );
  }

  // Check if salon is closed on this day
  const dayOfWeek = appointmentDate.getDay();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[dayOfWeek];
  
  // Get operating hours for the day
  let opening = "09:00";
  let closing = "18:00";
  
  // Check if salon has operating hours configured
  const operatingHours = salon.operatingHours;
  if (operatingHours && typeof operatingHours === 'object' && Object.keys(operatingHours).length > 0) {
    const dayHours = operatingHours[dayName];
    
    // If salon has operating hours configured for this day, check if closed
    if (dayHours && typeof dayHours === 'object') {
      if (dayHours.closed === true) {
        throw new AppError(`Salon is closed on ${dayName}`, 400);
      }
      // Use configured hours if available
      if (dayHours.open && typeof dayHours.open === 'string') opening = dayHours.open;
      if (dayHours.close && typeof dayHours.close === 'string') closing = dayHours.close;
    }
    // If no dayHours configured for this day, use defaults (salon might be open)
  }
  // If no operatingHours at all or empty object, use default hours (backward compatibility)

  // Check minimum advance booking
  if (appointmentDate.getTime() === today.getTime()) {
    if (!bookingSettings.allowSameDayBooking) {
      throw new AppError("Same-day booking is not allowed", 400);
    }

    if (bookingSettings.minAdvanceBookingHours > 0) {
      const now = new Date();
      const minBookingTime = new Date(now.getTime() + bookingSettings.minAdvanceBookingHours * 60 * 60 * 1000);
      const appointmentDateTime = new Date(appointmentDate);
      const [timeHour, timeMinute] = time.split(":").map(Number);
      appointmentDateTime.setHours(timeHour, timeMinute, 0, 0);

      if (appointmentDateTime < minBookingTime) {
        throw new AppError(
          `Please book at least ${bookingSettings.minAdvanceBookingHours} hours in advance`,
          400
        );
      }
    }
  }

  const interval = bookingSettings.slotInterval || 30;
  const blocksNeeded = Math.ceil(service.duration / interval);

  const { generateTimeSlots } = await import("../utils/generateSlots.js");
  const allSlots = generateTimeSlots(opening, closing, interval);

  const startIndex = allSlots.indexOf(time);
  if (startIndex === -1 || startIndex + blocksNeeded > allSlots.length) {
    throw new AppError("Invalid start time or exceeds working hours", 400);
  }

  const covers = allSlots.slice(startIndex, startIndex + blocksNeeded);

  // Check for conflicts
  const conflict = await Appointment.findOne({
    salonId,
    date: appointmentDate,
    time: { $in: covers },
    status: { $in: ["pending", "accepted", "in-progress"] },
  });
  
  if (conflict) {
    throw new AppError(
      "Selected time slot is already booked. Please choose another.",
      400
    );
  }

  const amount = service.price - (service.discount || 0);

  const appointment = await Appointment.create({
    customerId: req.user._id,
    salonId,
    serviceId,
    date: appointmentDate,
    time,
    amount,
    status: "pending",
    notes: notes || undefined,
  });

  const populatedAppointment = await Appointment.findById(appointment._id)
    .populate("customerId", "name email")
    .populate("serviceId", "name price duration")
    .populate("salonId", "name location");

  res.status(201).json({
    success: true,
    message: "Appointment booked successfully.",
    data: populatedAppointment,
  });
});

// -----------------------------
// RESCHEDULE appointment
export const rescheduleAppointment = asyncHandler(async (req, res) => {
  const { date, time } = req.body;
  const { id } = req.params;

  if (!date || !time) {
    throw new AppError("Please provide date and time", 400);
  }

  const appointment = await Appointment.findById(id);
  if (!appointment) {
    throw new AppError("Appointment not found", 404);
  }

  // Check if user owns this appointment (customer) or salon (owner)
  // Handle both populated and non-populated customerId
  const appointmentCustomerId = appointment.customerId?._id 
    ? appointment.customerId._id.toString() 
    : appointment.customerId.toString();
  
  if (req.user.role === "customer" && appointmentCustomerId !== req.user._id.toString()) {
    throw new AppError("You can only reschedule your own appointments", 403);
  }

  // Handle both populated and non-populated salonId
  const appointmentSalonId = appointment.salonId?._id 
    ? appointment.salonId._id.toString() 
    : appointment.salonId.toString();
  
  if (req.user.role === "owner" && req.salon && appointmentSalonId !== req.salon._id.toString()) {
    throw new AppError("You can only reschedule appointments for your salon", 403);
  }

  // Check if appointment can be rescheduled (not completed or cancelled)
  if (appointment.status === "completed" || appointment.status === "cancelled") {
    throw new AppError("Cannot reschedule completed or cancelled appointments", 400);
  }

  const Salon = (await import("../models/salon.js")).default;
  const salon = await Salon.findById(appointment.salonId);
  if (!salon) throw new AppError("Salon not found", 404);

  const service = await Service.findById(appointment.serviceId);
  if (!service) throw new AppError("Service not found", 404);

  // Validate new date
  const newDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  newDate.setHours(0, 0, 0, 0);

  if (newDate < today) {
    throw new AppError("Cannot reschedule to a past date", 400);
  }

  // Check booking restrictions
  const bookingSettings = salon.bookingSettings || {
    minAdvanceBookingHours: 2,
    maxAdvanceBookingDays: 30,
    slotInterval: 30,
    allowSameDayBooking: true,
  };

  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + bookingSettings.maxAdvanceBookingDays);
  if (newDate > maxDate) {
    throw new AppError(
      `Cannot reschedule more than ${bookingSettings.maxAdvanceBookingDays} days in advance`,
      400
    );
  }

  // Check if salon is closed
  const dayOfWeek = newDate.getDay();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[dayOfWeek];
  const operatingHours = salon.operatingHours || {};
  const dayHours = operatingHours[dayName];

  if (!dayHours || dayHours.closed) {
    throw new AppError(`Salon is closed on ${dayName}`, 400);
  }

  // Check for conflicts
  const interval = bookingSettings.slotInterval || 30;
  const blocksNeeded = Math.ceil(service.duration / interval);
  const { generateTimeSlots } = await import("../utils/generateSlots.js");
  const opening = dayHours.open || "09:00";
  const closing = dayHours.close || "18:00";
  const allSlots = generateTimeSlots(opening, closing, interval);

  const startIndex = allSlots.indexOf(time);
  if (startIndex === -1 || startIndex + blocksNeeded > allSlots.length) {
    throw new AppError("Invalid start time or exceeds working hours", 400);
  }

  const covers = allSlots.slice(startIndex, startIndex + blocksNeeded);

  const conflict = await Appointment.findOne({
    _id: { $ne: id }, // Exclude current appointment
    salonId: appointment.salonId,
    date: newDate,
    time: { $in: covers },
    status: { $in: ["pending", "accepted", "in-progress"] },
  });

  if (conflict) {
    throw new AppError("Selected time slot is already booked", 400);
  }

  // Update appointment
  appointment.date = newDate;
  appointment.time = time;
  await appointment.save();

  const populatedAppointment = await Appointment.findById(appointment._id)
    .populate("customerId", "name email")
    .populate("serviceId", "name price duration")
    .populate("salonId", "name location");

  res.json({
    success: true,
    message: "Appointment rescheduled successfully",
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
// DELETE/CANCEL appointment
export const deleteAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) throw new AppError("Appointment not found", 404);

  // Check permissions
  // Handle both populated and non-populated customerId
  const appointmentCustomerId = appointment.customerId?._id 
    ? appointment.customerId._id.toString() 
    : appointment.customerId.toString();
  
  if (req.user.role === "customer" && appointmentCustomerId !== req.user._id.toString()) {
    throw new AppError("You can only cancel your own appointments", 403);
  }

  // Handle both populated and non-populated salonId
  const appointmentSalonId = appointment.salonId?._id 
    ? appointment.salonId._id.toString() 
    : appointment.salonId.toString();
  
  if (req.user.role === "owner" && req.salon && appointmentSalonId !== req.salon._id.toString()) {
    throw new AppError("You can only cancel appointments for your salon", 403);
  }

  // Check cancellation policy for customers
  if (req.user.role === "customer") {
    const Salon = (await import("../models/salon.js")).default;
    const salon = await Salon.findById(appointment.salonId);
    const bookingSettings = salon?.bookingSettings || { cancellationHours: 24 };
    
    const appointmentDateTime = new Date(appointment.date);
    const [timeHour, timeMinute] = appointment.time.split(":").map(Number);
    appointmentDateTime.setHours(timeHour, timeMinute, 0, 0);
    
    const now = new Date();
    const hoursUntilAppointment = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilAppointment < bookingSettings.cancellationHours) {
      throw new AppError(
        `Cancellation must be made at least ${bookingSettings.cancellationHours} hours before the appointment`,
        400
      );
    }
  }

  // Mark as cancelled instead of deleting
  appointment.status = "cancelled";
  await appointment.save();

  res.json({ success: true, message: "Appointment cancelled successfully", data: appointment });
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

// -----------------------------
// UPDATE appointment status
export const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!status) {
    throw new AppError("Status is required", 400);
  }

  const allowedStatuses = ["pending", "accepted", "rejected", "in-progress", "completed", "cancelled", "no-show"];
  if (!allowedStatuses.includes(status)) {
    throw new AppError(`Invalid status. Allowed values: ${allowedStatuses.join(", ")}`, 400);
  }

  const filter = { _id: req.params.id };

  // Role-based filter
  if (req.user.role === "owner" && req.salon) {
    filter.salonId = req.salon._id;
  }

  const appointment = await Appointment.findOne(filter);
  if (!appointment) throw new AppError("Appointment not found", 404);

  const previousStatus = appointment.status;
  
  // Only allow accept/reject for pending appointments
  if ((status === "accepted" || status === "rejected") && previousStatus !== "pending") {
    throw new AppError("Can only accept or reject pending appointments", 400);
  }

  appointment.status = status;
  
  // Track status change timestamps
  if (status === "accepted" && previousStatus !== "accepted") {
    appointment.acceptedAt = new Date();
  }
  if (status === "in-progress" && previousStatus !== "in-progress") {
    appointment.startedAt = new Date();
  }
  if (status === "completed" && previousStatus !== "completed") {
    appointment.completedAt = new Date();
  }
  if (status === "no-show") {
    appointment.noShowAt = new Date();
  }
  
  await appointment.save();

  // Create notification for customer when appointment is accepted or rejected
  if ((status === "accepted" || status === "rejected") && previousStatus === "pending") {
    const Notification = (await import("../models/notification.js")).default;
    const Salon = (await import("../models/salon.js")).default;
    
    const salon = await Salon.findById(appointment.salonId);
    const salonName = salon ? salon.name : "the salon";
    
    let notificationType, notificationMessage;
    
    if (status === "accepted") {
      notificationType = "appointment_accepted";
      notificationMessage = `Your appointment at ${salonName} has been accepted.`;
    } else if (status === "rejected") {
      notificationType = "appointment_rejected";
      notificationMessage = `Your appointment at ${salonName} has been rejected.`;
    }

    await Notification.create({
      userId: appointment.customerId,
      appointmentId: appointment._id,
      type: notificationType,
      message: notificationMessage,
    });
  }

  const populatedAppointment = await Appointment.findById(appointment._id)
    .populate("customerId", "name email")
    .populate("serviceId", "name price")
    .populate("salonId", "name location");

  res.json({
    success: true,
    message: "Appointment status updated successfully",
    data: populatedAppointment,
  });
});

// -----------------------------
// GET completed bookings for customer
export const getCompletedBookings = asyncHandler(async (req, res) => {
  const { customerId } = req.query;

  const filter = {
    status: "completed",
  };

  // Role-based filter - customers can only see their own bookings
  if (req.user.role === "customer") {
    filter.customerId = req.user._id;
  } else if (customerId && req.user.role !== "customer") {
    // Admin/owner can specify customerId
    filter.customerId = customerId;
  } else if (req.user.role === "customer") {
    // If customer but no customerId in query, use their own ID
    filter.customerId = req.user._id;
  }

  const appointments = await Appointment.find(filter)
    .populate("salonId", "name location")
    .populate("serviceId", "name price duration")
    .populate("customerId", "name email")
    .sort({ date: -1, time: -1 });

  res.json({
    success: true,
    data: appointments,
  });
});
