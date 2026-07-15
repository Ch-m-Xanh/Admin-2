const { Router } = require("express");
const { Setting } = require("../models/Setting");
const { asyncHandler } = require("../utils/asyncHandler");
const { AppError } = require("../utils/AppError");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { emitPublic } = require("../socket");

const router = Router();

// Cac khoa cau hinh noi dung man Kham pha, kem gia tri mac dinh.
// Chi cho phep sua dung cac khoa nay (tranh ghi bua).
const SETTING_DEFAULTS = {
  // Phan tren (loi chao + cay theo danh muc)
  exploreGreetingTitle: "Hi, hôm nay bạn muốn tìm gì?",
  exploreGreetingSubtitle:
    "Mình có thể giúp bạn chọn loại cây phù hợp nhất cho từng không gian.",
  // Phan giua (Goc xanh song khoe)
  healthSectionTitle: "Góc xanh sống khỏe!",
  healthSectionSubtitle:
    "Những loại cây lành tính giúp bạn cải thiện sức khỏe mỗi ngày.",
  // Phan cuoi (bai viet)
  exploreArticleTitle: "Mẹo ủ phân hữu cơ đơn giản.",
};

async function getAllSettings() {
  const docs = await Setting.find({ key: { $in: Object.keys(SETTING_DEFAULTS) } });
  const values = { ...SETTING_DEFAULTS };
  docs.forEach((d) => {
    if (typeof d.value === "string" && d.value.trim()) values[d.key] = d.value;
  });
  return values;
}

// GET /api/settings (public) -> toan bo cau hinh noi dung man Kham pha.
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(await getAllSettings());
  })
);

// GET /api/settings/explore-title (public, giu tuong thich cu).
router.get(
  "/explore-title",
  asyncHandler(async (_req, res) => {
    const all = await getAllSettings();
    res.json({ title: all.exploreArticleTitle });
  })
);

// PUT /api/settings/:key (admin) -> cap nhat 1 khoa, phat realtime.
router.put(
  "/:key",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    // Cho phep /explore-title tro toi exploreArticleTitle.
    const alias = { "explore-title": "exploreArticleTitle" };
    const key = alias[req.params.key] || req.params.key;

    if (!Object.prototype.hasOwnProperty.call(SETTING_DEFAULTS, key)) {
      throw AppError.validation("Khoa cau hinh khong hop le");
    }
    const raw =
      req.body && (req.body.value != null || req.body.title != null)
        ? String(req.body.value != null ? req.body.value : req.body.title).trim()
        : "";
    if (!raw) {
      throw AppError.validation("Nội dung không được để trống");
    }

    await Setting.findOneAndUpdate(
      { key },
      { value: raw },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    emitPublic("settings:updated", { key, value: raw });
    res.json({ key, value: raw });
  })
);

module.exports = router;
