import { Request, Response, NextFunction } from "express";
import multer, { FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

// ────────────────────────────────────────────────────────────
// Storage configuration
// ────────────────────────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, "../../uploads/chat-media");

// Ensure directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const ALLOWED_IMAGES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic"];
const ALLOWED_VIDEOS = ["video/mp4", "video/quicktime", "video/webm"];
const ALLOWED_FILE_EXTS = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".zip", ".rar", ".txt"];

const IMAGE_MAX_MB = 10;
const VIDEO_MAX_MB = 50;
const FILE_MAX_MB = 10;
const IMAGE_MAX_BYTES = IMAGE_MAX_MB * 1024 * 1024;
const VIDEO_MAX_BYTES = VIDEO_MAX_MB * 1024 * 1024;
const FILE_MAX_BYTES = FILE_MAX_MB * 1024 * 1024;

// Use memoryStorage first so we can validate size before writing
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const random = crypto.randomBytes(3).toString("hex"); // 6 hex chars
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${timestamp}_${random}${ext}`);
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (ALLOWED_IMAGES.includes(file.mimetype) || ALLOWED_VIDEOS.includes(file.mimetype)) {
    cb(null, true);
  } else if (ALLOWED_FILE_EXTS.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new multer.MulterError(
        "LIMIT_UNEXPECTED_FILE",
        "Định dạng file không được hỗ trợ. Chỉ chấp nhận ảnh, video, hoặc các file văn phòng/zip/pdf/txt."
      )
    );
  }
};

// Large limit — we enforce per-type limit manually below
export const chatMediaUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: VIDEO_MAX_BYTES }, // Max limit overall
});

// ────────────────────────────────────────────────────────────
// Upload handler
// ────────────────────────────────────────────────────────────
export async function uploadChatMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ message: "Không tìm thấy file. Vui lòng chọn ảnh, video hoặc tập tin để gửi." });
      return;
    }

    const { mimetype, filename, originalname, size } = req.file;
    const isImage = ALLOWED_IMAGES.includes(mimetype);
    const isVideo = ALLOWED_VIDEOS.includes(mimetype);
    const isFile = !isImage && !isVideo;

    // Per-type size validation
    if (isImage && size > IMAGE_MAX_BYTES) {
      fs.unlinkSync(path.join(UPLOAD_DIR, filename));
      res.status(400).json({ message: `Ảnh quá lớn. Kích thước tối đa cho phép là ${IMAGE_MAX_MB}MB.` });
      return;
    }
    
    if (isFile && size > FILE_MAX_BYTES) {
      fs.unlinkSync(path.join(UPLOAD_DIR, filename));
      res.status(400).json({ message: `Tập tin quá lớn. Kích thước tối đa cho phép là ${FILE_MAX_MB}MB.` });
      return;
    }

    let type: "IMAGE" | "VIDEO" | "FILE" = "FILE";
    if (isImage) type = "IMAGE";
    if (isVideo) type = "VIDEO";

    const url = `/uploads/chat-media/${filename}`;

    res.status(200).json({
      url,
      type,
      filename,
      originalname,
      size,
    });
  } catch (error) {
    next(error);
  }
}
