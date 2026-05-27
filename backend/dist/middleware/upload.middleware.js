"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadAvatar = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const apiError_1 = require("../utils/apiError");
// Define absolute path for uploads folder
const uploadDir = path_1.default.join(__dirname, "../../../public/uploads/avatars");
// Ensure directory exists
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
// Storage configuration
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, `avatar-${uniqueSuffix}${ext}`);
    },
});
// File filter validator (images only)
const fileFilter = (req, file, cb) => {
    const allowedExtensions = /jpeg|jpg|png/;
    const mimetype = allowedExtensions.test(file.mimetype);
    const extname = allowedExtensions.test(path_1.default.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
        return cb(null, true);
    }
    cb(new apiError_1.ApiError("Only image files (.jpg, .jpeg, .png) are allowed", 400), false);
};
// Multer upload middleware instance
exports.uploadAvatar = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 2 * 1024 * 1024, // 2MB limit
    },
    fileFilter: fileFilter,
});
