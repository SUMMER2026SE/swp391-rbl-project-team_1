import { Router } from "express";
import { chatMediaUpload, uploadChatMedia } from "../controllers/chat-media.controller";
import { verifyToken } from "../middleware/auth.middleware";
import { Request, Response, NextFunction } from "express";
import multer from "multer";

const router = Router();

// Custom multer error handler
function handleMulterError(err: any, _req: Request, res: Response, next: NextFunction) {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "File quá lớn. Ảnh tối đa 10MB, video tối đa 50MB." });
    }
    return res.status(400).json({ message: err.message });
  }
  next(err);
}

// POST /api/chat/upload-media
router.post(
  "/upload-media",
  verifyToken,
  (req: Request, res: Response, next: NextFunction) => {
    chatMediaUpload.single("file")(req, res, (err) => {
      if (err) return handleMulterError(err, req, res, next);
      next();
    });
  },
  uploadChatMedia
);

export default router;
