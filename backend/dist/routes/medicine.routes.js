"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const medicine_controller_1 = require("../controllers/medicine.controller");
const router = (0, express_1.Router)();
router.get('/', medicine_controller_1.searchMedicines);
exports.default = router;
