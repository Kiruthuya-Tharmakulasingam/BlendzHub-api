import Customer from "../models/customer.js";
import { asyncHandler, AppError } from "../middleware/errorhandler.js";

export const getAllCustomers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    search,
    contact,
    sortBy = "createdAt",
    sortOrder = "desc",
    startDate,
    endDate,
  } = req.query;

  // Build filter object
  const filter = {};

  // Status filtering - supports single value or comma-separated values
  if (status) {
    const statusArray = status.split(",").map((s) => s.trim());
    if (statusArray.length === 1) {
      filter.status = statusArray[0];
    } else {
      filter.status = { $in: statusArray };
    }
  }

  // Contact number filtering (exact match or partial)
  if (contact) {
    const contactNum = Number(contact);
    if (!isNaN(contactNum)) {
      // Convert contact to string for partial matching
      filter.contact = contactNum;
    }
  }

  // Date range filtering
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) {
      filter.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      // Set to end of day for inclusive end date
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  // Text search across name, email, and contact
  if (search) {
    const searchRegex = new RegExp(search, "i");
    const searchNum = Number(search);
    
    // Build search conditions
    const searchConditions = [
      { name: searchRegex },
      { email: searchRegex },
    ];

    // If search is a number, also search in contact
    if (!isNaN(searchNum)) {
      searchConditions.push({ contact: searchNum });
    }

    // Combine search with existing filters
    // If there are other filters, use $and to combine them
    if (Object.keys(filter).length > 0) {
      // Create a new filter object with $and
      const combinedFilter = {
        $and: [
          { ...filter },
          { $or: searchConditions },
        ],
      };
      // Replace filter with combined filter
      Object.keys(filter).forEach((key) => delete filter[key]);
      Object.assign(filter, combinedFilter);
    } else {
      filter.$or = searchConditions;
    }
  }

  // Validate sortBy field
  const allowedSortFields = ["name", "email", "contact", "status", "createdAt", "updatedAt"];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
  const sortDirection = sortOrder.toLowerCase() === "asc" ? 1 : -1;
  const sort = { [sortField]: sortDirection };

  // Get total count with filters
  const total = await Customer.countDocuments(filter);

  // Calculate pagination
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit))); // Max 100 per page
  const skip = (pageNum - 1) * limitNum;
  const totalPages = Math.ceil(total / limitNum);

  // Fetch customers with filters, sorting, and pagination
  const customers = await Customer.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limitNum);

  res.json({
    success: true,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages,
    data: customers,
  });
});

export const getCustomerById = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) throw new AppError("Customer not found", 404);
  res.json({ success: true, data: customer });
});

export const createCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.create(req.body);
  res.status(201).json({ success: true, data: customer });
});

export const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!customer) throw new AppError("Customer not found", 404);
  res.json({ success: true, data: customer });
});

export const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findByIdAndDelete(req.params.id);
  if (!customer) throw new AppError("Customer not found", 404);
  res.json({ success: true, message: "Customer deleted successfully" });
});
