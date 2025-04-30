import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    // Generate a unique filename for the uploaded file
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const originalName = file.originalname;
    const ext = path.extname(originalName);
    
    // Make sure we only accept .js files, specifically named with .vip.js
    if (ext !== '.js' || !originalName.includes('.vip.js')) {
      return cb(new Error('Only VIP.js files are allowed'), '');
    }
    
    // Create a unique filename but preserve the vip.js extension
    const baseName = path.basename(originalName, ext);
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  },
});

// Create multer upload instance
export const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
  fileFilter: (_req, file, cb) => {
    // Check if the file is a .js file and has .vip.js in the name
    const ext = path.extname(file.originalname);
    if (ext !== '.js' || !file.originalname.includes('.vip.js')) {
      return cb(new Error('Only VIP.js files are allowed'));
    }
    cb(null, true);
  },
});

// Export a middleware function to handle file uploads
export const fileUploadMiddleware = upload.single('file');
