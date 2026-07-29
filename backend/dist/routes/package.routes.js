"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const package_controller_1 = require("../controllers/package.controller");
const router = express_1.default.Router();
router.get("/packages", package_controller_1.getPackages);
router.get("/packages/:id", package_controller_1.getPackageById);
router.get("/packages/:id/booked-slots", package_controller_1.getPackageBookedSlots);
exports.default = router;
