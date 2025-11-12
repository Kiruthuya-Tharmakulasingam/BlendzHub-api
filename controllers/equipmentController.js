import Equipment from "../models/equipment.js";
import Salon from "../models/salon.js";
import { asyncHandler, AppError } from "../middleware/errorhandler.js";

export const getAllEquipments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, salonId } = req.query;
  const filter = {};
  
  if (status) filter.status = status;
  if (salonId) filter.salonId = salonId;

  // Role-based filtering (if authenticated)
  if (req.user) {
    if (req.user.role === "owner" && req.salon) {
      filter.salonId = req.salon._id;
    } else if (req.user.role === "staff" && req.staff) {
      filter.salonId = req.staff.salonId;
      // Staff can see all equipment in their salon, not just assigned ones
    }
  }

  const total = await Equipment.countDocuments(filter);
  const equipments = await Equipment.find(filter)
    .populate("salonId", "name location")
    .populate("assignedToStaffId", "name role")
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({ createdAt: -1 });
  
  res.json({ success: true, total, data: equipments });
});

export const getEquipmentById = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };

  // Role-based access (if authenticated)
  if (req.user) {
    if (req.user.role === "owner" && req.salon) {
      filter.salonId = req.salon._id;
    } else if (req.user.role === "staff" && req.staff) {
      filter.salonId = req.staff.salonId;
    }
  }

  const equipment = await Equipment.findOne(filter)
    .populate("salonId", "name location")
    .populate("assignedToStaffId", "name role");

  if (!equipment) {
    throw new AppError("Equipment not found", 404);
  }

  res.json({ success: true, data: equipment });
});

// Create equipment (owner/admin only)
export const createEquipment = asyncHandler(async (req, res) => {
  let salonId = req.body.salonId;

  // If owner, use their salon
  if (req.user.role === "owner" && req.salon) {
    salonId = req.salon._id;
  }

  if (!salonId) {
    throw new AppError("Please provide salonId", 400);
  }

  // Verify salon exists
  const salon = await Salon.findById(salonId);
  if (!salon) {
    throw new AppError("Salon not found", 404);
  }

  // Verify owner owns this salon (if owner role)
  if (req.user.role === "owner" && salon.ownerId.toString() !== req.user._id.toString()) {
    throw new AppError("You can only create equipment for your own salon", 403);
  }

  const equipment = await Equipment.create({
    ...req.body,
    salonId,
  });

  const populatedEquipment = await Equipment.findById(equipment._id)
    .populate("salonId", "name location")
    .populate("assignedToStaffId", "name role");

  res.status(201).json({
    success: true,
    message: "Equipment created successfully",
    data: populatedEquipment,
  });
});

export const updateEquipment = asyncHandler(async (req, res) => {
  const equipment = await Equipment.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!equipment) throw new AppError("Equipment not found", 404);
  res.json({ success: true, data: equipment });
});

export const deleteEquipment = asyncHandler(async (req, res) => {
  const equipment = await Equipment.findByIdAndDelete(req.params.id);
  if (!equipment) throw new AppError("Equipment not found", 404);
  res.json({ success: true, message: "Equipment deleted successfully" });
});
