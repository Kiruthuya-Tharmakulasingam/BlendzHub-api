import mongoose from "mongoose";
import Service from "../models/service.js";
import Salon from "../models/salon.js";
import { asyncHandler, AppError } from "../middleware/errorhandler.js";

export const getAllServices = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    minPrice,
    maxPrice,
    price,
    minDiscount,
    maxDiscount,
    discount,
    sortBy = "createdAt",
    sortOrder = "desc",
    startDate,
    endDate,
    salonId,
  } = req.query;

  const filter = {};

  // STRICT SALON-BASED DATA ISOLATION
  // All service queries MUST filter by salonId - no exceptions
  
  let targetSalonId = null;
  
  // Owner-only access: owners can only see their own salon's services
  if (req.user && req.user.role === "owner") {
    // Owners MUST have a salon - if req.salon is not set, they need to create one first
    if (!req.salon) {
      throw new AppError("You must have a salon to access services. Please create a salon first.", 400);
    }
    
    // CRITICAL: Ensure req.salon._id exists and is valid
    if (!req.salon._id) {
      throw new AppError("Salon ID is missing. Please contact support.", 500);
    }
    
    // Owners automatically get their salon's services - always use req.salon._id
    targetSalonId = req.salon._id;
    
    // If owner provides salonId in query, validate it matches their salon
    if (salonId && salonId !== targetSalonId.toString()) {
      throw new AppError("You can only access services from your own salon", 403);
    }
  } else {
    // For non-owners (customers or unauthenticated users), salonId is REQUIRED
    // This ensures strict salon-based data isolation - no salon can see another salon's services
    if (!salonId) {
      throw new AppError("salonId is required to fetch services", 400);
    }
    targetSalonId = salonId;
  }
  
  // CRITICAL: Ensure targetSalonId is set (safety check)
  if (!targetSalonId) {
    throw new AppError("salonId filter is required for all service queries", 400);
  }
  
  // Validate salonId format to prevent injection or invalid queries
  if (!mongoose.Types.ObjectId.isValid(targetSalonId)) {
    throw new AppError("Invalid salonId format", 400);
  }
  
  // Convert to ObjectId to ensure consistent querying
  // CRITICAL: Always filter by salonId - this is the key to data isolation
  filter.salonId = new mongoose.Types.ObjectId(targetSalonId);

  // Price filtering
  if (price) {
    filter.price = Number(price);
  } else {
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
  }

  // Discount filtering
  if (discount !== undefined) {
    filter.discount = Number(discount);
  } else {
    if (minDiscount !== undefined || maxDiscount !== undefined) {
      filter.discount = {};
      if (minDiscount !== undefined) filter.discount.$gte = Number(minDiscount);
      if (maxDiscount !== undefined) filter.discount.$lte = Number(maxDiscount);
    }
  }

  // Date range filtering
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

  // Text search in name and description
  if (search) {
    const searchRegex = new RegExp(search, "i");
    const searchConditions = [
      { name: searchRegex },
      { description: searchRegex },
    ];

    if (Object.keys(filter).length > 0) {
      const combinedFilter = {
        $and: [
          { ...filter },
          { $or: searchConditions },
        ],
      };
      Object.keys(filter).forEach((key) => delete filter[key]);
      Object.assign(filter, combinedFilter);
    } else {
      filter.$or = searchConditions;
    }
  }

  // Validate sortBy field
  const allowedSortFields = ["name", "price", "discount", "createdAt", "updatedAt"];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
  const sortDirection = sortOrder.toLowerCase() === "asc" ? 1 : -1;
  const sort = { [sortField]: sortDirection };

  // Get total count with filters
  const total = await Service.countDocuments(filter);

  // Calculate pagination
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;
  const totalPages = Math.ceil(total / limitNum);

  // Fetch services with filters, sorting, and pagination
  // CRITICAL: Always filter by salonId - NEVER by salon type or category
  // This ensures strict salon-based data isolation
  const services = await Service.find(filter)
    .populate("salonId", "name location type") // Include type only for display, NOT for filtering
    .sort(sort)
    .skip(skip)
    .limit(limitNum);
  
  // CRITICAL: Additional validation - Ensure all returned services belong to the specified salon
  // This is a safety check to prevent any data leakage
  // Note: After populate, salonId becomes an object with _id, name, location, type
  const expectedSalonId = filter.salonId.toString();
  const validatedServices = services.filter(service => {
    // Handle populated salonId (object with _id property)
    let serviceSalonId = null;
    
    if (service.salonId) {
      if (typeof service.salonId === 'object' && service.salonId._id) {
        // Populated salonId (object)
        serviceSalonId = service.salonId._id.toString();
      } else if (service.salonId.toString) {
        // Non-populated salonId (ObjectId)
        serviceSalonId = service.salonId.toString();
      }
    }
    
    // Only include services that match the expected salonId
    if (!serviceSalonId) {
      console.error(`WARNING: Service ${service._id} has no salonId! This should never happen.`);
      return false;
    }
    
    if (serviceSalonId !== expectedSalonId) {
      console.error(`WARNING: Service ${service._id} belongs to salon ${serviceSalonId}, but expected ${expectedSalonId}! This should never happen.`);
      return false;
    }
    
    return true;
  });
  
  // Log warning if any services were filtered out
  if (validatedServices.length !== services.length) {
    console.error("ERROR: Service query returned services from different salons! This should never happen.");
    console.error(`Expected salonId: ${expectedSalonId}, but found ${services.length - validatedServices.length} services from other salons.`);
    console.error("This indicates a critical data integrity issue. Please investigate immediately.");
  }

  res.json({
    success: true,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages,
    data: validatedServices, // Use validated services to ensure strict isolation
  });
});

export const getServiceById = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };

  // STRICT SALON-BASED DATA ISOLATION
  // All service queries MUST filter by salonId - no exceptions
  
  let targetSalonId = null;
  
  // Owner-only access: owners can only see their own salon's services
  if (req.user && req.user.role === "owner") {
    // Owners MUST have a salon
    if (!req.salon) {
      throw new AppError("You must have a salon to access services. Please create a salon first.", 400);
    }
    
    // CRITICAL: Ensure req.salon._id exists and is valid
    if (!req.salon._id) {
      throw new AppError("Salon ID is missing. Please contact support.", 500);
    }
    
    targetSalonId = req.salon._id;
  } else {
    // For non-owners, require salonId in query params for strict isolation
    const { salonId } = req.query;
    if (!salonId) {
      throw new AppError("salonId is required to fetch service details", 400);
    }
    targetSalonId = salonId;
  }
  
  // CRITICAL: Ensure targetSalonId is set (safety check)
  if (!targetSalonId) {
    throw new AppError("salonId filter is required for all service queries", 400);
  }
  
  // Validate salonId format to prevent injection or invalid queries
  if (!mongoose.Types.ObjectId.isValid(targetSalonId)) {
    throw new AppError("Invalid salonId format", 400);
  }
  
  // Convert to ObjectId to ensure consistent querying
  filter.salonId = new mongoose.Types.ObjectId(targetSalonId);

  const service = await Service.findOne(filter).populate("salonId", "name location");

  if (!service) {
    throw new AppError("Service not found", 404);
  }

  res.json({ success: true, data: service });
});

export const createService = asyncHandler(async (req, res) => {
  // STRICT SALON-BASED DATA ISOLATION
  // For owners, ALWAYS use their salon - never allow them to specify a different salonId
  
  let salonId = null;
  let salonObjectId = null;

  // If owner, ALWAYS use their salon - ignore any salonId in request body
  if (req.user && req.user.role === "owner") {
    // Owners MUST have a salon
    if (!req.salon) {
      throw new AppError("You must have a salon to create services. Please create a salon first.", 400);
    }
    
    // CRITICAL: Ensure req.salon._id exists and is valid
    if (!req.salon._id) {
      throw new AppError("Salon ID is missing. Please contact support.", 500);
    }
    
    // Force use of owner's salon - prevent any salonId manipulation
    // Convert to string first, then validate
    salonId = req.salon._id.toString();
    
    // Validate the salonId format
    if (!mongoose.Types.ObjectId.isValid(salonId)) {
      throw new AppError("Invalid salon ID format. Please contact support.", 500);
    }
    
    // Convert to ObjectId for database operations
    salonObjectId = new mongoose.Types.ObjectId(salonId);
    
    // Remove salonId from body to prevent any override attempts
    delete req.body.salonId;
  } else {
    // For non-owners, require salonId in request body
    salonId = req.body.salonId;
    
    if (!salonId) {
      throw new AppError("salonId is required to create a service", 400);
    }
    
    // Validate salonId format
    if (!mongoose.Types.ObjectId.isValid(salonId)) {
      throw new AppError("Invalid salonId format", 400);
    }
    
    salonObjectId = new mongoose.Types.ObjectId(salonId);
  }

  // CRITICAL: Ensure salonObjectId is set before proceeding
  if (!salonObjectId) {
    throw new AppError("Service creation failed: salonId is required", 400);
  }

  // Verify salon exists
  const salon = await Salon.findById(salonObjectId);
  if (!salon) {
    throw new AppError("Salon not found", 404);
  }

  // Verify owner owns this salon (if owner role) - double check security
  if (
    req.user &&
    req.user.role === "owner" &&
    salon.ownerId.toString() !== req.user._id.toString()
  ) {
    throw new AppError("You can only create services for your own salon", 403);
  }

  // PREVENT DUPLICATES: Check if service with same name already exists for this salon
  const existingService = await Service.findOne({
    name: req.body.name?.trim(),
    salonId: salonObjectId,
  });

  if (existingService) {
    throw new AppError(
      `A service with the name "${req.body.name}" already exists for this salon.`,
      409
    );
  }

  // Create service with explicit salonId - ensure it's always set correctly
  // CRITICAL: Never allow category/type-based service creation
  // Each service belongs to ONE specific salon identified by salonId
  // Explicitly set salonId to prevent any possibility of it being undefined or wrong
  
  // Prepare service data - explicitly set salonId, never trust req.body
  const serviceData = {
    name: req.body.name?.trim(),
    price: Number(req.body.price),
    description: req.body.description?.trim() || undefined,
    discount: req.body.discount ? Number(req.body.discount) : 0,
    duration: Number(req.body.duration),
    imageUrl: req.body.imageUrl || undefined,
    salonId: salonObjectId, // CRITICAL: Always explicitly set, never from req.body
  };

  // Validate required fields
  if (!serviceData.name) {
    throw new AppError("Service name is required", 400);
  }
  if (!serviceData.price || serviceData.price <= 0) {
    throw new AppError("Service price must be greater than 0", 400);
  }
  if (!serviceData.duration || serviceData.duration <= 0) {
    throw new AppError("Service duration must be greater than 0", 400);
  }

  // Double-check: Ensure salonId is in the service data and matches expected value
  if (!serviceData.salonId) {
    throw new AppError("Service creation failed: salonId is missing from service data", 500);
  }
  
  if (serviceData.salonId.toString() !== salonObjectId.toString()) {
    throw new AppError("Service creation failed: salonId mismatch in service data", 500);
  }
  
  // Create the service
  const service = await Service.create(serviceData);
  
  // CRITICAL: Verify the service was created with the correct salonId
  // Re-fetch to ensure we have the actual database value
  const createdService = await Service.findById(service._id);
  
  if (!createdService) {
    throw new AppError("Service creation failed: service not found after creation", 500);
  }
  
  if (!createdService.salonId) {
    // If salonId is missing, delete the service and throw error
    await Service.findByIdAndDelete(service._id);
    throw new AppError("Service creation failed: salonId was not saved. This should never happen.", 500);
  }
  
  if (createdService.salonId.toString() !== salonObjectId.toString()) {
    // If salonId doesn't match, delete the service and throw error
    await Service.findByIdAndDelete(service._id);
    throw new AppError(`Service creation failed: salonId mismatch. Expected ${salonObjectId.toString()}, got ${createdService.salonId.toString()}`, 500);
  }

  const populatedService = await Service.findById(service._id).populate(
    "salonId",
    "name location"
  );

  res.status(201).json({
    success: true,
    message: "Service created successfully",
    data: populatedService,
  });
});

export const updateService = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };

  // STRICT SALON-BASED DATA ISOLATION
  // All service queries MUST filter by salonId - no exceptions
  
  let targetSalonId = null;
  
  // Owner-only access: owners can only update their own salon's services
  if (req.user && req.user.role === "owner") {
    // Owners MUST have a salon
    if (!req.salon) {
      throw new AppError("You must have a salon to update services. Please create a salon first.", 400);
    }
    
    // CRITICAL: Ensure req.salon._id exists and is valid
    if (!req.salon._id) {
      throw new AppError("Salon ID is missing. Please contact support.", 500);
    }
    
    targetSalonId = req.salon._id;
  } else {
    // For non-owners, require salonId in query params
    const { salonId } = req.query;
    if (!salonId) {
      throw new AppError("salonId is required to update service", 400);
    }
    targetSalonId = salonId;
  }

  // NEVER allow changing salonId - prevent service migration between salons
  if (req.body.salonId) {
    delete req.body.salonId;
  }
  
  // CRITICAL: Ensure targetSalonId is set (safety check)
  if (!targetSalonId) {
    throw new AppError("salonId filter is required for all service queries", 400);
  }
  
  // Validate salonId format to prevent injection or invalid queries
  if (!mongoose.Types.ObjectId.isValid(targetSalonId)) {
    throw new AppError("Invalid salonId format", 400);
  }
  
  // Convert to ObjectId to ensure consistent querying
  filter.salonId = new mongoose.Types.ObjectId(targetSalonId);

  const service = await Service.findOneAndUpdate(filter, req.body, {
    new: true,
  }).populate("salonId", "name location");

  if (!service) {
    throw new AppError("Service not found", 404);
  }

  res.json({ success: true, data: service });
});

export const deleteService = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };

  // STRICT SALON-BASED DATA ISOLATION
  // All service queries MUST filter by salonId - no exceptions
  
  let targetSalonId = null;
  
  // Owner-only access: owners can only delete their own salon's services
  if (req.user && req.user.role === "owner") {
    // Owners MUST have a salon
    if (!req.salon) {
      throw new AppError("You must have a salon to delete services. Please create a salon first.", 400);
    }
    
    // CRITICAL: Ensure req.salon._id exists and is valid
    if (!req.salon._id) {
      throw new AppError("Salon ID is missing. Please contact support.", 500);
    }
    
    targetSalonId = req.salon._id;
  } else {
    // For non-owners, require salonId in query params
    const { salonId } = req.query;
    if (!salonId) {
      throw new AppError("salonId is required to delete service", 400);
    }
    targetSalonId = salonId;
  }
  
  // CRITICAL: Ensure targetSalonId is set (safety check)
  if (!targetSalonId) {
    throw new AppError("salonId filter is required for all service queries", 400);
  }
  
  // Validate salonId format to prevent injection or invalid queries
  if (!mongoose.Types.ObjectId.isValid(targetSalonId)) {
    throw new AppError("Invalid salonId format", 400);
  }
  
  // Convert to ObjectId to ensure consistent querying
  filter.salonId = new mongoose.Types.ObjectId(targetSalonId);

  const service = await Service.findOneAndDelete(filter);

  if (!service) {
    throw new AppError("Service not found", 404);
  }

  res.json({ success: true, message: "Service deleted successfully" });
});
