const { AppError } = require("../utils/AppError");

// Xu ly loi tap trung. Moi response loi cua toan API co CUNG mot shape de
// client (mobile/web) render bang 1 component "Global Popup":
//   { error: { message: string, code: string } }
function errorHandler(err, _req, res, _next) {
  // Loi ung dung co chu dinh
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: { message: err.message, code: err.code } });
  }

  // Loi validate cua Mongoose
  if (err && err.name === "ValidationError") {
    return res.status(422).json({ error: { message: err.message, code: "VALIDATION_ERROR" } });
  }

  // Trung khoa (unique) cua Mongoose
  if (err && err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res.status(409).json({
      error: { message: `Gia tri cua truong '${field}' da ton tai`, code: "DUPLICATE_KEY" },
    });
  }

  // Cast ObjectId sai
  if (err && err.name === "CastError") {
    return res.status(400).json({ error: { message: "Id khong hop le", code: "INVALID_ID" } });
  }

  // Loi JWT
  if (err && (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError")) {
    return res
      .status(401)
      .json({ error: { message: "Token khong hop le hoac da het han", code: "UNAUTHORIZED" } });
  }

  // Loi Multer (upload)
  if (err && err.name === "MulterError") {
    return res.status(400).json({ error: { message: err.message, code: "UPLOAD_ERROR" } });
  }

  console.error("[UNHANDLED ERROR]", err);
  return res.status(500).json({
    error: { message: "Loi he thong, vui long thu lai sau", code: "INTERNAL_ERROR" },
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({
    error: { message: `Khong tim thay route ${req.method} ${req.originalUrl}`, code: "ROUTE_NOT_FOUND" },
  });
}

module.exports = { errorHandler, notFoundHandler };
