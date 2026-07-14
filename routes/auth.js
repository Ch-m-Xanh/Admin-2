const { Router } = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../models/User");
const { asyncHandler } = require("../utils/asyncHandler");
const { AppError } = require("../utils/AppError");
const { requireAuth } = require("../middleware/auth");

const router = Router();

function signAccessToken(user) {
  return jwt.sign({ id: user._id.toString(), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
}

function signRefreshToken(user) {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  return jwt.sign({ id: user._id.toString(), role: user.role }, secret, { expiresIn: "30d" });
}

function isEmail(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { name, email, password, gardenName } = req.body || {};
    if (!name || String(name).trim() === "") {
      throw AppError.validation("Ten khong duoc de trong");
    }
    if (!isEmail(email)) {
      throw AppError.validation("Email khong hop le");
    }
    if (!password || String(password).length < 6) {
      throw AppError.validation("Mat khau phai co it nhat 6 ky tu");
    }

    const existing = await User.findOne({ email: String(email).toLowerCase() });
    if (existing) {
      throw AppError.conflict("Email nay da duoc dang ky", "EMAIL_TAKEN");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: String(email).toLowerCase(),
      passwordHash,
      gardenName: gardenName || "",
      role: "user",
    });

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    res.status(201).json({ token: accessToken, accessToken, refreshToken, user });
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};
    if (!isEmail(email)) {
      throw AppError.validation("Email khong hop le");
    }
    if (!password) {
      throw AppError.validation("Mat khau khong duoc de trong");
    }

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) {
      throw new AppError("Email hoac mat khau khong dung", 401, "INVALID_CREDENTIALS");
    }
    if (user.isLocked) {
      throw AppError.forbidden("Tai khoan cua ban da bi khoa", "ACCOUNT_LOCKED");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new AppError("Email hoac mat khau khong dung", 401, "INVALID_CREDENTIALS");
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    res.json({ token: accessToken, accessToken, refreshToken, user });
  })
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) {
      throw AppError.notFound("Khong tim thay nguoi dung");
    }
    res.json(user);
  })
);

module.exports = router;
