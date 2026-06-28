import express from "express";
import {
  createShortUrl,
  getUserShortUrls,
  getShortUrlDetails,
  updateShortUrl,
  deleteShortUrl,
  getShortUrlAnalytics,
  bulkDelete,
  getUrlTags,
  getUrlsByTagName,
  exportAnalytics,
  generateAPIKey,
  getUserSettings,
  updateUserSettings,
  generateQrCode,
} from "../controller/short_url.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

// QR Code generation (public endpoint, no auth required)
router.get("/qr/generate", generateQrCode);

// Basic CRUD
router.post("/", authMiddleware, createShortUrl);
router.get("/", authMiddleware, getUserShortUrls);

// Advanced features
router.post("/bulk/delete", authMiddleware, bulkDelete);
router.get("/tags/all", authMiddleware, getUrlTags);
router.get("/tags/:tag", authMiddleware, getUrlsByTagName);
router.get("/:shortId/analytics/export", authMiddleware, exportAnalytics);

// Settings & API
router.post("/api-key/generate", authMiddleware, generateAPIKey);
router.get("/settings/profile", authMiddleware, getUserSettings);
router.put("/settings/update", authMiddleware, updateUserSettings);

router.get("/:shortId/analytics", authMiddleware, getShortUrlAnalytics);
router.get("/:shortId", getShortUrlDetails);
router.put("/:shortId", authMiddleware, updateShortUrl);
router.delete("/:shortId", authMiddleware, deleteShortUrl);

export default router;
