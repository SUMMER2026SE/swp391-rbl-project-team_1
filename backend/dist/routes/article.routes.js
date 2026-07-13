"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const article_controller_1 = require("../controllers/article.controller");
const router = (0, express_1.Router)();
// Publicly accessible article routes
router.get("/articles", article_controller_1.getPublicArticles);
router.get("/articles/realtime", article_controller_1.getRealtimeArticles);
exports.default = router;
