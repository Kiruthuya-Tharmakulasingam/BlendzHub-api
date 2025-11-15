import Equipment from "../models/equipment.js";
import Salon from "../models/salon.js";
import { asyncHandler, AppError } from "../middleware/errorhandler.js";

export const getAllEquipments = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    salonId,
    assignedToStaffId,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
    startDate,
    endDate,
    lastSterlizedStartDate,
    lastSterlizedEndDate,
  } = req.query;

  const filter = {};

  // Role-based filtering (if authenticated)
  if (req.user) {
    if (req.user.role === "owner" && req.salon) {
      filter.salonId = req.salon._id;
    } else if (req.user.role === "staff" && req.staff) {
      filter.salonId = req.staff.salonId;
      // Staff can see all equipment in their salon, not just assigned ones
    }
  }

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
  if (assignedToStaffId) filter.assignedToStaffId = assignedToStaffId;

  // Date range filtering (createdAt)
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) {
      filter.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  // Last sterilized date range filtering
  if (lastSterlizedStartDate || lastSterlizedEndDate) {
    filter.lastSterlizedDate = {};
    if (lastSterlizedStartDate) {
      filter.lastSterlizedDate.$gte = new Date(lastSterlizedStartDate);
    }
    if (lastSterlizedEndDate) {
      const end = new Date(lastSterlizedEndDate);
      end.setHours(23, 59, 59, 999);
      filter.lastSterlizedDate.$lte = end;
    }
  }

  // Text search in name
  if (search) {
    const searchRegex = new RegExp(search, "i");
    if (Object.keys(filter).length > 0) {
      const combinedFilter = {
        $and: [
          { ...filter },
          { name: searchRegex },
        ],
      };
      Object.keys(filter).forEach((key) => delete filter[key]);
      Object.assign(filter, combinedFilter);
    } else {
      filter.name = searchRegex;
    }
  }

  // Validate sortBy field
  const allowedSortFields = ["name", "status", "lastSterlizedDate", "createdAt", "updatedAt"];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
  const sortDirection = sortOrder.toLowerCase() === "asc" ? 1 : -1;
  const sort = { [sortField]: sortDirection };

  // Get total count with filters
  const total = await Equipment.countDocuments(filter);

  // Calculate pagination
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;
  const totalPages = Math.ceil(total / limitNum);

  // Fetch equipment with filters, sorting, and pagination
  const equipments = await Equipment.find(filter)
    .populate("salonId", "name location")
    .populate("assignedToStaffId", "name role")
    .sort(sort)
    .skip(skip)
    .limit(limitNum);
  
  res.json({
    success: true,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages,
    data: equipments,
  });
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
