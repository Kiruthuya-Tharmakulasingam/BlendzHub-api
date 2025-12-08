import express from 'express';
import cloudinary from '../config/cloudinary.js';
import upload from '../middleware/upload.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Upload image to Cloudinary
router.post('/upload', authenticate, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Upload to Cloudinary using upload_stream
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'user_profiles',
          upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
          resource_type: 'image'
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      // Write buffer to stream
      uploadStream.end(req.file.buffer);
    });

    const result = await uploadPromise;

    res.status(200).json({
      success: true,
      data: {
        url: result.secure_url,
        secure_url: result.secure_url,
        public_id: result.public_id
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: error.message
    });
  }
});

export default router;
