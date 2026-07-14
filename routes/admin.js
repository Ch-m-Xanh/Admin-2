const { Router } = require("express");
const { User } = require("../models/User");
const { Plant } = require("../models/Plant");
const { Post } = require("../models/Post");
const { Article } = require("../models/Article");
const { asyncHandler } = require("../utils/asyncHandler");
const { AppError } = require("../utils/AppError");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = Router();
router.use(requireAuth, requireAdmin);

router.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [totalUsers, totalPlants, totalArticles, totalPostsThisWeek, topViewedPlants, recentUsers] =
      await Promise.all([
        User.countDocuments(),
        Plant.countDocuments(),
        Article.countDocuments(),
        Post.countDocuments({ createdAt: { $gte: startOfWeek } }),
        Plant.find().sort({ viewCount: -1 }).limit(5),
        User.find({ createdAt: { $gte: sevenDaysAgo } }, { createdAt: 1 }),
      ]);

    const newUsersLast7Days = new Array(7).fill(0);
    for (const u of recentUsers) {
      const diffDays = Math.floor((now.getTime() - new Date(u.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      const index = 6 - diffDays;
      if (index >= 0 && index < 7) newUsersLast7Days[index] += 1;
    }

    res.json({
      totalUsers,
      totalPlants,
      totalArticles,
      totalPostsThisWeek,
      topViewedPlants,
      newUsersLast7Days,
    });
  })
);

router.get(
  "/users",
  asyncHandler(async (_req, res) => {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  })
);

router.put(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const { isLocked, role, name, gardenName } = req.body || {};
    const patch = {};
    if (isLocked !== undefined) patch.isLocked = Boolean(isLocked);
    if (role !== undefined) {
      if (!["user", "admin"].includes(role)) throw AppError.validation("Vai tro khong hop le");
      patch.role = role;
    }
    if (name !== undefined) patch.name = name;
    if (gardenName !== undefined) patch.gardenName = gardenName;

    const user = await User.findByIdAndUpdate(req.params.id, patch, {
      new: true,
      runValidators: true,
    });
    if (!user) {
      throw AppError.notFound("Khong tim thay nguoi dung", "USER_NOT_FOUND");
    }
    res.json(user);
  })
);

router.delete(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      throw AppError.notFound("Khong tim thay nguoi dung", "USER_NOT_FOUND");
    }
    res.json({ success: true });
  })
);

module.exports = router;
