const jwt = require("jsonwebtoken");
const { AppError } = require("../utils/AppError");

function extractToken(req) {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    return header.slice(7);
  }
  return null;
}

// Bat buoc dang nhap. Gan req.user = { id, role }.
function requireAuth(req, _res, next) {
  const token = extractToken(req);
  if (!token) {
    return next(AppError.unauthorized("Thieu token xac thuc"));
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch (err) {
    next(err);
  }
}

// Gan req.user neu co token hop le, nhung khong bao gio chan request.
function optionalAuth(req, _res, next) {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, role: payload.role };
  } catch (_err) {
    // bo qua token khong hop le
  }
  next();
}

function requireAdmin(req, _res, next) {
  if (!req.user) {
    return next(AppError.unauthorized());
  }
  if (req.user.role !== "admin") {
    return next(AppError.forbidden("Chi admin moi co quyen thuc hien hanh dong nay"));
  }
  next();
}

module.exports = { requireAuth, optionalAuth, requireAdmin };
