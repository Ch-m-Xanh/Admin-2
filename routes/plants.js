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

  // --- Cac truong chi tiet ---
  if (body.harvestTime !== undefined) out.harvestTime = String(body.harvestTime || "");
  if (body.soilType !== undefined) out.soilType = String(body.soilType || "");
  if (body.healthBenefits !== undefined) out.healthBenefits = String(body.healthBenefits || "");
  if (body.harvestTimeline !== undefined) out.harvestTimeline = String(body.harvestTimeline || "");
  if (body.didYouKnow !== undefined) out.didYouKnow = String(body.didYouKnow || "");
  if (body.forYou !== undefined) out.forYou = String(body.forYou || "");
  if (body.seedPrice !== undefined) {
    const n = Number(String(body.seedPrice).replace(/[^\d.]/g, ""));
    out.seedPrice = Number.isFinite(n) && n > 0 ? n : null;
  }
  // careInstructions: chap nhan mang [{title, body}] hoac chuoi nhieu dong
  // "Tiêu đề | mô tả" (moi dong 1 muc).
  if (body.careInstructions !== undefined) {
    if (Array.isArray(body.careInstructions)) {
      out.careInstructions = body.careInstructions
        .map((it) => ({
          title: String((it && it.title) || "").trim(),
          body: String((it && it.body) || "").trim(),
        }))
        .filter((it) => it.title || it.body);
    } else {
      out.careInstructions = String(body.careInstructions)
        .split("\n")
        .map((line) => {
          const idx = line.indexOf("|");
          const title = idx >= 0 ? line.slice(0, idx) : line;
          const bodyText = idx >= 0 ? line.slice(idx + 1) : "";
          return { title: title.trim(), body: bodyText.trim() };
        })
        .filter((it) => it.title || it.body);
    }
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
