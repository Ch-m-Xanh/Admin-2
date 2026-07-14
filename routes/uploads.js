const { Router } = require("express");
const { upload } = require("../middleware/upload");
const { AppError } = require("../utils/AppError");

const router = Router();

// LUU Y: tren Render Free file upload la ephemeral (mat khi server ngu).
// Anh bia bai viet nen dung URL. Endpoint nay chu yeu cho app Mobile.
router.post("/", upload.single("file"), (req, res, next) => {
  if (!req.file) {
    return next(AppError.validation("Khong co file nao duoc gui len", "NO_FILE"));
  }
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
});

module.exports = router;
