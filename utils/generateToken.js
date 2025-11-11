import jwt from "jsonwebtoken";

// Generate JWT Token
export const generateToken = (id) => {
  const secret = process.env.JWT_SECRET;
  
  if (!secret || secret.trim() === "") {
    const error = new Error("JWT_SECRET is not configured. Please set it in Vercel Dashboard → Settings → Environment Variables.");
    error.code = "JWT_SECRET_MISSING";
    throw error;
  }
  
  try {
    return jwt.sign({ id }, secret, {
      expiresIn: process.env.JWT_EXPIRE || "30d",
    });
  } catch (error) {
    if (error.message.includes("secretOrPrivateKey")) {
      const newError = new Error("JWT_SECRET is empty or invalid. Please check Vercel Dashboard → Settings → Environment Variables and ensure JWT_SECRET has a value.");
      newError.code = "JWT_SECRET_INVALID";
      throw newError;
    }
    throw error;
  }
};

