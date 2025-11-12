import Staff from "../models/staff.js";
import Service from "../models/service.js";
import { asyncHandler, AppError } from "../middleware/errorhandler.js";

// @desc    Get staff members who specialize in a specific service
// @route   GET /api/staff/specializations/:serviceId
// @access  Public
export const getStaffByService = asyncHandler(async (req, res) => {
  const { serviceId } = req.params;
  const { salonId } = req.query;

  // Verify service exists
  const service = await Service.findById(serviceId);
  if (!service) {
    throw new AppError("Service not found", 404);
  }

  const filter = {
    specializations: serviceId,
    isApprovedByOwner: true,
  };

  // Filter by salon if provided
  if (salonId) {
    filter.salonId = salonId;
  }

  const staff = await Staff.find(filter)
    .populate("userId", "name email")
    .populate("salonId", "name location")
    .populate("specializations", "name price")
    .select("-approvedByOwner -approvedAt");

  res.json({
    success: true,
    total: staff.length,
    service: {
      id: service._id,
      name: service.name,
      price: service.price,
    },
    data: staff,
  });
});

// @desc    Get all services with staff specializations
// @route   GET /api/staff/specializations
// @access  Public
export const getAllSpecializations = asyncHandler(async (req, res) => {
  const { salonId } = req.query;

  const filter = { isApprovedByOwner: true };
  if (salonId) {
    filter.salonId = salonId;
  }

  const staff = await Staff.find(filter)
    .populate("specializations", "name price")
    .populate("salonId", "name location");

  // Group by service
  const serviceMap = new Map();

  staff.forEach((staffMember) => {
    staffMember.specializations.forEach((service) => {
      if (!serviceMap.has(service._id.toString())) {
        serviceMap.set(service._id.toString(), {
          service: {
            id: service._id,
            name: service.name,
            price: service.price,
          },
          staff: [],
        });
      }
      serviceMap.get(service._id.toString()).staff.push({
        id: staffMember._id,
        name: staffMember.name,
        role: staffMember.role,
        salon: {
          id: staffMember.salonId._id,
          name: staffMember.salonId.name,
          location: staffMember.salonId.location,
        },
      });
    });
  });

  res.json({
    success: true,
    total: serviceMap.size,
    data: Array.from(serviceMap.values()),
  });
});

