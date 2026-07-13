"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateBookingCode = generateBookingCode;
const dayjs_1 = __importDefault(require("dayjs"));
function generateRandomChars(length) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
/**
 * Generate a unique booking code. Format: MBK-YYYYMMDD-XXXXXX
 */
function generateBookingCode() {
    return `MBK-${(0, dayjs_1.default)().format("YYYYMMDD")}-${generateRandomChars(6)}`;
}
