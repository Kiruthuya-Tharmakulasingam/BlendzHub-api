import Equipment from "../models/equipment.js";
import Salon from "../models/salon.js";
import { asyncHandler, AppError } from "../middleware/errorhandler.js";

// =========================================
// GET ALL EQUIPMENTS
// =========================================
export const getAllEquipments = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    salonId,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
    startDate,
    endDate,
    lastSterlizedStartDate,
    lastSterlizedEndDate,
  } = req.query;

  const filter = {};

  // ---------- OWNER-ONLY ACCESS ----------
  // Owners can only see their own salon's equipment
  if (req.user.role === "owner" && req.salon) {
    filter.salonId = req.salon._id;
  }

  // Status filtering
  if (status) {
    const statusArray = status.split(",").map((s) => s.trim());
    filter.status =
      statusArray.length > 1 ? { $in: statusArray } : statusArray[0];
  }

  // ---------- SALON FILTER ----------
  // If salonId is provided, it must match the owner's salon
  if (salonId) {
    if (req.user.role === "owner" && req.salon && salonId !== req.salon._id.toString()) {
      throw new AppError("You can only access equipment from your own salon", 403);
    }
    filter.salonId = salonId;
  }

  // ---------- CREATED DATE FILTER ----------
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  // ---------- LAST STERILIZED DATE FILTER ----------
  if (lastSterlizedStartDate || lastSterlizedEndDate) {
    filter.lastSterlizedDate = {};
    if (lastSterlizedStartDate)
      filter.lastSterlizedDate.$gte = new Date(lastSterlizedStartDate);

    if (lastSterlizedEndDate) {
      const endSter = new Date(lastSterlizedEndDate);
      endSter.setHours(23, 59, 59, 999);
      filter.lastSterlizedDate.$lte = endSter;
    }
  }

  // ---------- SEARCH BY NAME ----------
  if (search) {
    const searchRegex = new RegExp(search, "i");

    if (Object.keys(filter).length > 0) {
      const combinedFilter = { $and: [{ ...filter }, { name: searchRegex }] };
      Object.keys(filter).forEach((key) => delete filter[key]);
      Object.assign(filter, combinedFilter);
    } else {
      filter.name = searchRegex;
    }
  }

  // ---------- SORTING ----------
  const allowedSortFields = [
    "name",
    "status",
    "lastSterlizedDate",
    "createdAt",
    "updatedAt",
  ];

  const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";

  const sortDirection = sortOrder.toLowerCase() === "asc" ? 1 : -1;
  const sort = { [sortField]: sortDirection };

  // ---------- PAGINATION ----------
  const total = await Equipment.countDocuments(filter);
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;
  const totalPages = Math.ceil(total / limitNum);

  // ---------- FETCH DATA ----------
  const equipments = await Equipment.find(filter)
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
    data: equipments,
  });
});

// GET EQUIPMENT BY ID

export const getEquipmentById = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };

  // Owner-only access: owners can only see their own salon's equipment
  if (req.user.role === "owner" && req.salon) {
    filter.salonId = req.salon._id;
  }

  const equipment = await Equipment.findOne(filter).populate(
    "salonId",
    "name location"
  );

  if (!equipment) {
    throw new AppError("Equipment not found", 404);
  }

  res.json({
    success: true,
    data: equipment,
  });
});

// CREATE EQUIPMENT

export const createEquipment = asyncHandler(async (req, res) => {
  let salonId = req.body.salonId;

  // If owner, only add to their own salon
  if (req.user.role === "owner" && req.salon) {
    salonId = req.salon._id;
  }

  if (!salonId) throw new AppError("Please provide salonId", 400);

  const salon = await Salon.findById(salonId);
  if (!salon) throw new AppError("Salon not found", 404);

  // Owners can only create for their own salon
  if (
    req.user.role === "owner" &&
    salon.ownerId.toString() !== req.user._id.toString()
  ) {
    throw new AppError("You can only create equipment for your own salon", 403);
  }

  const equipment = await Equipment.create({ ...req.body, salonId });

  const populatedEquipment = await Equipment.findById(equipment._id).populate(
    "salonId",
    "name location"
  );

  res.status(201).json({
    success: true,
    message: "Equipment created successfully",
    data: populatedEquipment,
  });
});

// UPDATE EQUIPMENT

export const updateEquipment = asyncHandler(async (req, res) => {
  const equipment = await Equipment.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });

  if (!equipment) throw new AppError("Equipment not found", 404);

  res.json({ success: true, data: equipment });
});

// DELETE EQUIPMENT

export const deleteEquipment = asyncHandler(async (req, res) => {
  const equipment = await Equipment.findByIdAndDelete(req.params.id);

  if (!equipment) throw new AppError("Equipment not found", 404);

  res.json({
    success: true,
    message: "Equipment deleted successfully",
  });
});
