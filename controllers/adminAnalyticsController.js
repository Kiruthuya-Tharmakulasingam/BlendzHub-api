import Salon from "../models/salon.js";
import Appointment from "../models/appointment.js";
import { asyncHandler, AppError } from "../middleware/errorhandler.js";

// @desc    Get all salons with appointment counts
// @route   GET /api/admin/analytics/salons
// @access  Private/Admin
export const getSalonsWithAppointments = asyncHandler(async (req, res) => {
  const salons = await Salon.find()
    .populate("ownerId", "name email")
    .sort({ createdAt: -1 });

  // Get appointment counts for each salon
  const salonsWithCounts = await Promise.all(
    salons.map(async (salon) => {
      const appointmentCount = await Appointment.countDocuments({
        salonId: salon._id,
      });
      const completedCount = await Appointment.countDocuments({
        salonId: salon._id,
        status: "completed",
      });
      const pendingCount = await Appointment.countDocuments({
        salonId: salon._id,
        status: "pending",
      });

      return {
        ...salon.toObject(),
        appointmentCount,
        completedCount,
        pendingCount,
      };
    })
  );

  res.json({
    success: true,
    total: salonsWithCounts.length,
    data: salonsWithCounts,
  });
});

// @desc    Get salon appointment statistics
// @route   GET /api/admin/analytics/salons/:salonId
// @access  Private/Admin
export const getSalonStatistics = asyncHandler(async (req, res) => {
  const { salonId } = req.params;

  const salon = await Salon.findById(salonId).populate("ownerId", "name email");
  if (!salon) {
    throw new AppError("Salon not found", 404);
  }

  const totalAppointments = await Appointment.countDocuments({ salonId });
  const completedAppointments = await Appointment.countDocuments({
    salonId,
    status: "completed",
  });
  const pendingAppointments = await Appointment.countDocuments({
    salonId,
    status: "pending",
  });
  const inProgressAppointments = await Appointment.countDocuments({
    salonId,
    status: "in-progress",
  });

  // Calculate revenue from completed appointments
  const completedAppts = await Appointment.find({
    salonId,
    status: "completed",
  });
  const totalRevenue = completedAppts.reduce((sum, apt) => sum + (apt.amount || 0), 0);

  res.json({
    success: true,
    salon: {
      id: salon._id,
      name: salon.name,
      location: salon.location,
      owner: salon.ownerId,
    },
    statistics: {
      totalAppointments,
      completedAppointments,
      pendingAppointments,
      inProgressAppointments,
      totalRevenue,
    },
  });
});

