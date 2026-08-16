import multer from 'multer';
import path from 'path';

// Store files in memory buffer (so they don't persist on disk)
const storage = multer.memoryStorage();

// Check file extension and mimetype
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|webp/;
  const extname = allowedExtensions.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedExtensions.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Invalid file type. Only jpg, jpeg, png, and webp images are accepted.'
      ),
      false
    );
  }
};

// Multer instance
export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB limits
  },
  fileFilter
});

export default upload;
