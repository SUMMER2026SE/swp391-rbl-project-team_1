"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchMedicines = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const searchMedicines = async (req, res) => {
    try {
        const { query } = req.query;
        let medicines;
        if (query && typeof query === 'string' && query.trim() !== '') {
            medicines = await client_1.default.medicine.findMany({
                where: {
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { activeIngredient: { contains: query, mode: 'insensitive' } }
                    ]
                },
                take: 20
            });
        }
        else {
            medicines = await client_1.default.medicine.findMany({ take: 20 });
        }
        res.status(200).json({ success: true, data: medicines });
    }
    catch (error) {
        console.error('Error searching medicines:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};
exports.searchMedicines = searchMedicines;
