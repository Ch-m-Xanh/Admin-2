const { Router } = require("express");
const { UserPlant } = require("../models/UserPlant");
const { asyncHandler } = require("../utils/asyncHandler");
const { AppError } = require("../utils/AppError");
const { requireAuth } = require("../middleware/auth");
const { emitToUser } = require("../socket");

const router = Router();
router.use(requireAuth);

function parseReminder(body) {
  const out = {};
  if (body.enabled !== undefined) out.enabled = Boolean(body.enabled);
  if (body.wateringIntervalDays !== undefined) out.wateringIntervalDays = Number(body.wateringIntervalDays);
  if (body.fertilizingIntervalDays !== undefined) out.fertilizingIntervalDays = Number(body.fertilizingIntervalDays);
  if (body.notifyTime !== undefined) out.notifyTime = String(body.notifyTime);
  return out;
}

function parseUserPlant(body, partial) {
  const out = {};
  if (body.plantId !== undefined) out.plantId = body.plantId || undefined;
  if (body.customName !== undefined) out.customName = String(body.customName).trim();
  if (body.photoUrl !== undefined) out.photoUrl = String(body.photoUrl);
  if (body.space !== undefined) out.space = String(body.space || "");
  if (body.plantGroup !== undefined) out.plantGroup = String(body.plantGroup || "");
  if (body.light !== undefined) out.light = String(body.light || "");
  if (body.reminder !== undefined) out.reminder = parseReminder(body.reminder || {});
  if (!partial) {
    if (!out.customName) throw AppError.validation("Ten cay khong duoc de trong");
    if (!out.photoUrl) throw AppError.validation("Anh cay khong duoc de trong");
  }
  return out;
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const userPlants = await UserPlant.find({ userId: req.user.id })
      .populate("plantId")
      .sort({ addedAt: -1 });
    res.json(userPlants);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = parseUserPlant(req.body || {}, false);
    const userPlant = await UserPlant.create({ ...data, userId: req.user.id });
    emitToUser(req.user.id, "user-plant:created", userPlant.toJSON());
    res.status(201).json(userPlant);
  })
);

async function findOwned(id, userId) {
  const userPlant = await UserPlant.findOne({ _id: id, userId });
  if (!userPlant) {
    throw AppError.notFound("Khong tim thay cay trong vuon cua ban", "USER_PLANT_NOT_FOUND");
  }
  return userPlant;
}

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = parseUserPlant(req.body || {}, true);
    await findOwned(req.params.id, req.user.id);
    const userPlant = await UserPlant.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });
    emitToUser(req.user.id, "user-plant:updated", userPlant.toJSON());
    res.json(userPlant);
  })
);

router.put(
  "/:id/reminder",
  asyncHandler(async (req, res) => {
    const reminder = parseReminder(req.body || {});
    await findOwned(req.params.id, req.user.id);
    const set = {};
    for (const [k, v] of Object.entries(reminder)) set[`reminder.${k}`] = v;
    const userPlant = await UserPlant.findByIdAndUpdate(
      req.params.id,
      { $set: set },
      { new: true, runValidators: true }
    );
    emitToUser(req.user.id, "user-plant:updated", userPlant.toJSON());
    res.json(userPlant);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await findOwned(req.params.id, req.user.id);
    await UserPlant.findByIdAndDelete(req.params.id);
    emitToUser(req.user.id, "user-plant:deleted", { _id: req.params.id });
    res.json({ success: true });
  })
);

module.exports = router;
