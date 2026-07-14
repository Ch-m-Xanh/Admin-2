const { Router } = require("express");
const { Post } = require("../models/Post");
const { asyncHandler } = require("../utils/asyncHandler");
const { AppError } = require("../utils/AppError");
const { requireAuth } = require("../middleware/auth");

const router = Router();

// GET /api/posts?userId= -> danh sach post cua 1 user (tab Grid/Calendar Ho so vuon)
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { userId } = req.query;
    if (!userId) {
      throw AppError.validation("Thieu tham so userId", "MISSING_USER_ID");
    }
    const posts = await Post.find({ userId }).sort({ createdAt: -1 });
    res.json({ posts });
  })
);

router.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { userPlantId, imageUrl, caption } = req.body || {};
    if (!imageUrl || String(imageUrl).trim() === "") {
      throw AppError.validation("Anh khong duoc de trong");
    }
    const post = await Post.create({
      userId: req.user.id,
      userPlantId: userPlantId || undefined,
      imageUrl,
      caption: caption || "",
    });
    res.status(201).json({ post });
  })
);

module.exports = router;
