const { Router } = require("express");
const { Setting } = require("../models/Setting");
const { asyncHandler } = require("../utils/asyncHandler");
const { AppError } = require("../utils/AppError");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { emitPublic } = require("../socket");

const router = Router();

// Key duy nhat cho tieu de muc bai viet ("Meo u phan huu co...") tren app.
const EXPLORE_TITLE_KEY = "exploreArticleTitle";
const EXPLORE_TITLE_DEFAULT = "Mẹo ủ phân hữu cơ đơn giản.";

async function getExploreTitle() {
  const doc = await Setting.findOne({ key: EXPLORE_TITLE_KEY });
  return doc && typeof doc.value === "string" && doc.value.trim()
    ? doc.value
    : EXPLORE_TITLE_DEFAULT;
}

// GET /api/settings/explore-title  (public) -> { title }
// App doc tieu de muc bai viet o man Kham pha.
router.get(
  "/explore-title",
  asyncHandler(async (_req, res) => {
    const title = await getExploreTitle();
    res.json({ title });
  })
);

// PUT /api/settings/explore-title  (admin) -> cap nhat "tieu de hom nay".
router.put(
  "/explore-title",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const raw = (req.body && req.body.title) != null ? String(req.body.title).trim() : "";
    if (!raw) {
      throw AppError.validation("Tiêu đề không được để trống");
    }
    await Setting.findOneAndUpdate(
      { key: EXPLORE_TITLE_KEY },
      { value: raw },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    // Realtime: app dang mo se cap nhat tieu de ngay.
    emitPublic("settings:updated", { key: EXPLORE_TITLE_KEY, value: raw });
    res.json({ title: raw });
  })
);

module.exports = router;
