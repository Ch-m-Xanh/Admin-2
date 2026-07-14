const { Router } = require("express");
const { User } = require("../models/User");
const { asyncHandler } = require("../utils/asyncHandler");
const { AppError } = require("../utils/AppError");
const { requireAuth } = require("../middleware/auth");

const router = Router();

// Cap nhat ho so cua chinh minh (EditProfileScreen / EditGardenScreen).
router.patch(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { name, avatarUrl, gardenName, gardenDescription } = req.body || {};
    const patch = {};
    if (name !== undefined) patch.name = name;
    if (avatarUrl !== undefined) patch.avatarUrl = avatarUrl;
    if (gardenName !== undefined) patch.gardenName = gardenName;
    if (gardenDescription !== undefined) patch.gardenDescription = gardenDescription;

    const user = await User.findByIdAndUpdate(req.user.id, patch, {
      new: true,
      runValidators: true,
    });
    if (!user) {
      throw AppError.notFound("Khong tim thay nguoi dung");
    }
    res.json(user);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw AppError.notFound("Khong tim thay nguoi dung nay", "USER_NOT_FOUND");
    }
    res.json(user);
  })
);

router.post(
  "/:id/follow",
  requireAuth,
  asyncHandler(async (req, res) => {
    const targetId = req.params.id;
    const currentId = req.user.id;
    if (targetId === currentId) {
      throw AppError.validation("Ban khong the tu theo doi chinh minh", "CANNOT_FOLLOW_SELF");
    }
    const target = await User.findById(targetId);
    if (!target) {
      throw AppError.notFound("Khong tim thay nguoi dung nay", "USER_NOT_FOUND");
    }
    await User.findByIdAndUpdate(currentId, { $addToSet: { followingIds: targetId } });
    await User.findByIdAndUpdate(targetId, { $addToSet: { followerIds: currentId } });
    res.json({ success: true });
  })
);

router.delete(
  "/:id/follow",
  requireAuth,
  asyncHandler(async (req, res) => {
    const targetId = req.params.id;
    const currentId = req.user.id;
    const target = await User.findById(targetId);
    if (!target) {
      throw AppError.notFound("Khong tim thay nguoi dung nay", "USER_NOT_FOUND");
    }
    await User.findByIdAndUpdate(currentId, { $pull: { followingIds: targetId } });
    await User.findByIdAndUpdate(targetId, { $pull: { followerIds: currentId } });
    res.json({ success: true });
  })
);

module.exports = router;
