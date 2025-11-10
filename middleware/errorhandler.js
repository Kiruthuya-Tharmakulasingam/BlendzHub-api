// Custom Error class
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Async handler wrapper - catches async errors and passes them to error handler
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Main error handler middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error("Error:", err);

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    const message = "Resource not found";
    error = new AppError(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = "Duplicate field value entered";
    error = new AppError(message, 400);
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const fieldErrors = Object.keys(err.errors).map((field) => ({
      field,
      message: err.errors[field].message,
    }));
    // Attach detailed field errors to the error object
    error = new AppError("Validation failed", 400);
    error.fieldErrors = fieldErrors;
  }

  const statusCode = error.statusCode || err.statusCode || 500;
  const message = error.message || "Server Error";

  const response = {
    success: false,
    message,
  };

  if (error.fieldErrors) {
    response.errors = error.fieldErrors;
  }

  if (process.env.NODE_ENV === "development") {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

export default errorHandler;
