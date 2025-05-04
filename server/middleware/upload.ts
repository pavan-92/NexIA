import { Request, Response, NextFunction } from "express";
import multer from "multer";

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only audio files
    if (file.mimetype.startsWith("audio/")) {
      cb(null, true);
    } else {
      cb(new Error("Only audio files are allowed"));
    }
  },
});

// Middleware for handling audio file uploads
export const uploadAudio = (req: Request, res: Response, next: NextFunction) => {
  const singleUpload = upload.single("audio");
  
  singleUpload(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      // Multer error (file size, etc.)
      return res.status(400).json({
        error: `Upload error: ${err.message}`,
      });
    } else if (err) {
      // Other errors
      return res.status(400).json({
        error: err.message || "Error uploading file",
      });
    }
    
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({
        error: "Please upload an audio file",
      });
    }
    
    next();
  });
};
