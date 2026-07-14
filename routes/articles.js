const { Router } = require("express");
const { Article } = require("../models/Article");
const { asyncHandler } = require("../utils/asyncHandler");
const { AppError } = require("../utils/AppError");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { emitPublic } = require("../socket");

const router = Router();

// GET /api/articles  -> danh sach bai viet da xuat ban (cho app + trang admin).
// ?all=true (admin) -> lay ca ban nhap.
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const filter = req.query.all === "true" ? {} : { published: true };
    const articles = await Article.find(filter).sort({ createdAt: -1 });
    res.json(articles);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const article = await Article.findById(req.params.id);
    if (!article) {
      throw AppError.notFound("Khong tim thay bai viet nay", "ARTICLE_NOT_FOUND");
    }
    res.json(article);
  })
);

function parseArticleBody(body, partial) {
  const out = {};
  if (body.title !== undefined) out.title = String(body.title).trim();
  if (body.content !== undefined) out.content = String(body.content);
  if (body.coverImageUrl !== undefined) out.coverImageUrl = String(body.coverImageUrl || "");
  if (body.tags !== undefined) {
    out.tags = Array.isArray(body.tags)
      ? body.tags
      : String(body.tags)
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
  }
  if (body.published !== undefined) out.published = Boolean(body.published);

  if (!partial) {
    if (!out.title) throw AppError.validation("Tieu de khong duoc de trong");
    if (!out.content) throw AppError.validation("Noi dung khong duoc de trong");
  }
  return out;
}

router.post(
  "/",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = parseArticleBody(req.body || {}, false);
    const article = await Article.create(data);
    // Realtime: app dang mo se tu refetch danh sach bai viet.
    emitPublic("article:created", article.toJSON());
    res.status(201).json(article);
  })
);

router.put(
  "/:id",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = parseArticleBody(req.body || {}, true);
    const article = await Article.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });
    if (!article) {
      throw AppError.notFound("Khong tim thay bai viet nay", "ARTICLE_NOT_FOUND");
    }
    emitPublic("article:updated", article.toJSON());
    res.json(article);
  })
);

router.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const article = await Article.findByIdAndDelete(req.params.id);
    if (!article) {
      throw AppError.notFound("Khong tim thay bai viet nay", "ARTICLE_NOT_FOUND");
    }
    emitPublic("article:deleted", { _id: article._id.toString() });
    res.json({ success: true });
  })
);

module.exports = router;
