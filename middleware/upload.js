const fs = require("fs");
const path = require("path");
const multer = require("multer");

// LUU Y: tren Render goi Free, thu muc nay la ephemeral - file se mat khi
// server ngu/restart. Anh bia bai viet nen dung URL (luu chuoi trong Mongo).
// Endpoint /api/uploads chu yeu phuc vu app Mobile upload anh bai dang (posts).
const uploadDir = path.join(__dirname, "..", "public", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, "");
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${base}-${unique}${ext}`);
  },
});

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      return cb(new Error("Chi ho tro file anh (jpeg, png, webp, gif)"));
    }
    cb(null, true);
  },
});

module.exports = { upload };
