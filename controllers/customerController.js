import Customer from "../models/customer.js";
import asyncHandler from "../middleware/asyncHandler.js";

export const getAllCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const customers = await Customer.find().skip(skip).limit(limit);
    const totalCustomers = await Customer.countDocuments();
    res.status(200).json({
      success: true,
      message: "Customers fetched successfully",
      page,
      limit,
      totalCustomers,
      totalPages: Math.ceil(totalCustomers / limit),
      customers,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET customer by ID
export const getCustomerById = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) return res.status(404).json({ error: "Customer not found" });
  res.status(200).json(customer);
});

// POST customers
export const createCustomer = asyncHandler(async (req, res) => {
  const newCustomer = new Customer(req.body);
  const savedCustomer = await newCustomer.save();
  res.status(200).json({
    message: "Customer created successfully",
    customer: savedCustomer,
  });
});

// PUT customers
export const updateCustomer = asyncHandler(async (req, res) => {
  const updatedCustomer = await Customer.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  if (!updatedCustomer)
    return res.status(404).json({ error: "Customer not found" });
  res.status(200).json({
    message: "Customer updated successfully",
    customer: updatedCustomer,
  });
});

// DELETE customers
export const deleteCustomer = asyncHandler(async (req, res) => {
  const deletedCustomer = await Customer.findByIdAndDelete(req.params.id);
  if (!deletedCustomer)
    return res.status(404).json({ error: "Customer not found" });
  res.status(200).json({
    message: "Customer deleted successfully",
    customer: deletedCustomer,
  });
});
