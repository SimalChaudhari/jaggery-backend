import multer from 'multer';

// Configure multer to store files in memory (as buffer) for Cloudinary upload
const memoryStorage = multer.memoryStorage();

// File filter to accept only images
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

// Create multer instance for category (memory storage for Cloudinary upload)
export const uploadCategory = multer({
  storage: memoryStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Create multer instance for use-case (memory storage for Cloudinary upload)
export const uploadUseCase = multer({
  storage: memoryStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Create multer instance for products (memory storage for Cloudinary upload)
export const uploadProduct = multer({
  storage: memoryStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Create multer instance for other uploads (memory storage)
export const upload = multer({
  storage: memoryStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Middleware for single file upload (category)
export const uploadSingle = uploadCategory.single('image');

// Middleware for single file upload (use-case)
export const uploadUseCaseSingle = uploadUseCase.single('image');

// Middleware for multiple file uploads (product)
export const uploadProductMultiple = uploadProduct.array('images', 10); // Max 10 images

// Middleware for multiple file uploads (generic)
export const uploadMultiple = upload.array('images', 10); // Max 10 images

