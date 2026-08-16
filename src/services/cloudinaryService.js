import { Readable } from 'stream';
import cloudinary from '../config/cloudinary.js';
import env from '../config/env.js';

/**
 * Upload image buffer to Cloudinary using standard stream pipeline
 * @param {Object} file - Express Multer file object (in-memory)
 * @returns {Promise<string>} Secure URL of the uploaded image
 */
export const uploadImage = (file) => {
  return new Promise((resolve, reject) => {
    // If Cloudinary is not configured, fall back to simulation mode
    if (
      !env.CLOUDINARY_CLOUD_NAME ||
      !env.CLOUDINARY_API_KEY ||
      !env.CLOUDINARY_API_SECRET
    ) {
      console.log(
        'ℹ️ Cloudinary simulation: Returning mockup image URL.'
      );
      // Return a premium Unsplash healthy salad bowl photo
      return resolve(
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800'
      );
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'food_nutrition_analyzer',
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
      },
      (error, result) => {
        if (error) {
          console.error('❌ Cloudinary Upload API Error:', error);
          return reject(
            new Error(`Cloudinary upload failed: ${error.message}`)
          );
        }
        console.log('✅ Image uploaded successfully to Cloudinary');
        resolve(result.secure_url);
      }
    );

    // Pipe the buffer into the write stream
    const stream = new Readable();
    stream.push(file.buffer);
    stream.push(null); // End of stream marker
    stream.pipe(uploadStream);
  });
};

/**
 * Delete image from Cloudinary using secure URL
 * @param {string} imageUrl - The full secure url from Cloudinary
 * @returns {Promise<void>}
 */
export const deleteImage = async (imageUrl) => {
  if (
    !imageUrl ||
    !env.CLOUDINARY_CLOUD_NAME ||
    !env.CLOUDINARY_API_KEY ||
    !env.CLOUDINARY_API_SECRET
  ) {
    return;
  }

  try {
    // Extract public ID from URL. Example:
    // https://res.cloudinary.com/demo/image/upload/v1570975200/food_nutrition_analyzer/abc123xyz.jpg
    const uploadIndex = imageUrl.indexOf('/upload/');
    if (uploadIndex === -1) return;

    const pathAfterUpload = imageUrl.substring(uploadIndex + 8); // Skip "/upload/"
    const pathParts = pathAfterUpload.split('/');
    // Check if version segment exists (starts with 'v' followed by digits)
    if (pathParts[0].match(/^v\d+$/)) {
      pathParts.shift(); // Remove version segment
    }

    const publicIdWithExt = pathParts.join('/');
    const publicId = publicIdWithExt.substring(
      0,
      publicIdWithExt.lastIndexOf('.')
    );

    console.log(`🧹 Cloudinary: Deleting public ID: ${publicId}`);
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error(`⚠️ Cloudinary Deletion Error: ${error.message}`);
  }
};

export default {
  uploadImage,
  deleteImage
};
