import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

async function uploadHeroImage() {
  try {
    // Path to the hero image
    const imagePath = path.join(
      __dirname,
      "../../blendzhub-client/public/salon-wall-mirror-work.png"
    );

    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      console.error("Image file not found at:", imagePath);
      process.exit(1);
    }

    console.log("Uploading hero image to Cloudinary...");
    console.log("File:", imagePath);

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(imagePath, {
      folder: "blendzhub",
      public_id: "hero-salon-image",
      resource_type: "image",
      overwrite: true, // Overwrite if exists
      transformation: [{ quality: "auto" }, { fetch_format: "auto" }],
    });

    console.log("Upload successful!");
    console.log("Image Details:");
    console.log("   Public ID:", result.public_id);
    console.log("   URL:", result.secure_url);
    console.log("   Format:", result.format);
    console.log("   Width:", result.width);
    console.log("   Height:", result.height);
    console.log("   Size:", (result.bytes / 1024).toFixed(2), "KB");

    console.log("Use this URL in your frontend:");
    console.log("   " + result.secure_url);

    console.log("Add this to your .env file:");
    console.log("   HERO_IMAGE_URL=" + result.secure_url);

    return result.secure_url;
  } catch (error) {
    console.error("Upload failed:", error.message);
    process.exit(1);
  }
}

// Run the upload
uploadHeroImage();
