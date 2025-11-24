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

  if (contact) {
    filter.contact = new RegExp(contact.trim(), "i");
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

  if (search) {
    const searchRegex = new RegExp(search, "i");
    const searchConditions = [
      { name: searchRegex },
      { email: searchRegex },
      { contact: searchRegex },
    ];

    if (Object.keys(filter).length > 0) {
      const combinedFilter = {
        $and: [{ ...filter }, { $or: searchConditions }],
      };
      Object.keys(filter).forEach((key) => delete filter[key]);
      Object.assign(filter, combinedFilter);
    } else {
      filter.$or = searchConditions;
    }
  }

  const allowedSortFields = [
    "name",
    "email",
    "contact",
    "status",
    "createdAt",
    "updatedAt",
  ];
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
  const { name, contact, status } = req.body;

  const existing = await Customer.findOne({ userId: req.user._id });
  if (existing) {
    throw new AppError("Customer profile already exists.", 400);
  }

  if (!contact) {
    throw new AppError("Contact number is required.", 400);
  }

  const resolvedName = name || req.user.name;
  if (!resolvedName) {
    throw new AppError("Name is required.", 400);
  }

  const customer = await Customer.create({
    userId: req.user._id,
    name: resolvedName,
    email: req.user.email,
    contact: String(contact).trim(),
    status: status || "active",
  });

  res.status(201).json({ success: true, data: customer });
});

export const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) throw new AppError("Customer not found", 404);

  if (!customer.userId.equals(req.user._id)) {
    throw new AppError("You can only update your own profile.", 403);
  }

  if (req.body.name !== undefined) {
    customer.name = req.body.name;
  }
  if (req.body.contact !== undefined) {
    const normalizedContact = String(req.body.contact).trim();
    if (!normalizedContact) {
      throw new AppError("Contact number cannot be empty.", 400);
    }
    customer.contact = normalizedContact;
  }
  if (req.body.status !== undefined) {
    customer.status = req.body.status;
  }

  await customer.save();

  res.json({ success: true, data: customer });
});

export const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) throw new AppError("Customer not found", 404);

  if (!customer.userId.equals(req.user._id)) {
    throw new AppError("You can only delete your own profile.", 403);
  }

  await customer.deleteOne();

  res.json({ success: true, message: "Customer deleted successfully" });
});
