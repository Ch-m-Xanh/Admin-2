const { Router } = require("express");
const { Plant } = require("../models/Plant");
const { asyncHandler } = require("../utils/asyncHandler");
const { AppError } = require("../utils/AppError");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { emitPublic } = require("../socket");

const router = Router();

function parsePlantBody(body, partial) {
  const out = {};
  if (body.name !== undefined) out.name = String(body.name).trim();
  if (body.scientificName !== undefined) out.scientificName = String(body.scientificName || "");
  if (body.description !== undefined) out.description = String(body.description || "");
  if (body.careLevel !== undefined) out.careLevel = body.careLevel;
  if (body.light !== undefined) out.light = String(body.light || "");
  if (body.water !== undefined) out.water = String(body.water || "");
  if (body.category !== undefined) out.category = String(body.category).trim();
  if (body.isMedicinal !== undefined) out.isMedicinal = Boolean(body.isMedicinal);
  if (body.images !== undefined) {
    out.images = Array.isArray(body.images) ? body.images : [String(body.images)].filter(Boolean);
  }
  // Cho phep admin nhap 1 URL anh don gian qua truong imageUrl -> luu vao images[0].
  if (body.imageUrl !== undefined && body.imageUrl) {
    out.images = [String(body.imageUrl)];
  }
  if (body.tags !== undefined) {
    out.tags = Array.isArray(body.tags)
      ? body.tags
      : String(body.tags)
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
  }
  if (!partial) {
    if (!out.name) throw AppError.validation("Ten cay khong duoc de trong");
    if (!out.category) throw AppError.validation("Danh muc khong duoc de trong");
  }
  return out;
}

// GET /api/plants?category=&search=&isMedicinal=
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { category, search, isMedicinal } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (isMedicinal !== undefined) filter.isMedicinal = isMedicinal === "true";
    if (search) {
      filter.$or = [
        { name: { $regex: String(search), $options: "i" } },
        { scientificName: { $regex: String(search), $options: "i" } },
        { tags: { $regex: String(search), $options: "i" } },
      ];
    }
    const plants = await Plant.find(filter).sort({ createdAt: -1 });
    res.json(plants);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const plant = await Plant.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true }
    );
    if (!plant) {
      throw AppError.notFound("Khong tim thay cay nay", "PLANT_NOT_FOUND");
    }
    res.json(plant);
  })
);

router.post(
  "/",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = parsePlantBody(req.body || {}, false);
    const plant = await Plant.create(data);
    emitPublic("plant:created", plant.toJSON());
    res.status(201).json(plant);
  })
);

router.put(
  "/:id",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = parsePlantBody(req.body || {}, true);
    const plant = await Plant.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });
    if (!plant) {
      throw AppError.notFound("Khong tim thay cay nay", "PLANT_NOT_FOUND");
    }
    emitPublic("plant:updated", plant.toJSON());
    res.json(plant);
  })
);

router.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const plant = await Plant.findByIdAndDelete(req.params.id);
    if (!plant) {
      throw AppError.notFound("Khong tim thay cay nay", "PLANT_NOT_FOUND");
    }
    emitPublic("plant:deleted", { _id: plant._id.toString() });
    res.json({ success: true });
  })
);

// --- Yeu thich (favorite) cua app Mobile ---
// App goi POST/DELETE /plants/:id/favorite. Luu don gian de app khong loi;
// trang thai favorite thuc te van do app tu quan ly qua isFavorite.
router.post(
  "/:id/favorite",
  requireAuth,
  asyncHandler(async (req, res) => {
    const plant = await Plant.findById(req.params.id);
    if (!plant) throw AppError.notFound("Khong tim thay cay nay", "PLANT_NOT_FOUND");
    res.json({ success: true });
  })
);

router.delete(
  "/:id/favorite",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ success: true });
  })
);

module.exports = router;
