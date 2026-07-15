const { Router } = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const { User } = require("../models/User");
const { asyncHandler } = require("../utils/asyncHandler");
const { AppError } = require("../utils/AppError");
const { requireAuth } = require("../middleware/auth");

const router = Router();

// Chap nhan nhieu client id (web / android / ios) ngan cach boi dau phay.
const GOOGLE_CLIENT_IDS = (process.env.GOOGLE_CLIENT_ID || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const googleClient = new OAuth2Client();

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

    // Tai khoan dang ky bang Google khong co mat khau.
    if (!user.passwordHash) {
      throw new AppError(
        "Tai khoan nay dang nhap bang Google, vui long dung nut Google",
        401,
        "INVALID_CREDENTIALS"
      );
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

router.post(
  "/google",
  asyncHandler(async (req, res) => {
    const { idToken } = req.body || {};
    if (!idToken || String(idToken).trim() === "") {
      throw AppError.validation("Thieu idToken");
    }

    if (GOOGLE_CLIENT_IDS.length === 0) {
      throw new AppError("Server chua cau hinh GOOGLE_CLIENT_ID", 500, "GOOGLE_NOT_CONFIGURED");
    }

    // Xac thuc id_token voi Google va kiem tra audience khop client id cua ta.
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: GOOGLE_CLIENT_IDS,
      });
      payload = ticket.getPayload();
    } catch (e) {
      throw new AppError("Token Google khong hop le", 401, "INVALID_CREDENTIALS");
    }

    if (!payload || !payload.sub || !payload.email) {
      throw new AppError("Token Google khong hop le", 401, "INVALID_CREDENTIALS");
    }
    if (payload.email_verified === false) {
      throw new AppError("Email Google chua duoc xac thuc", 401, "INVALID_CREDENTIALS");
    }

    const email = String(payload.email).toLowerCase();

    // Uu tien tim theo googleId, sau do theo email (lien ket tai khoan cu).
    let user = await User.findOne({ googleId: payload.sub });
    if (!user) {
      user = await User.findOne({ email });
    }

    if (!user) {
      user = await User.create({
        name: payload.name || email.split("@")[0],
        email,
        googleId: payload.sub,
        avatarUrl: payload.picture || "",
        role: "user",
      });
    } else {
      let changed = false;
      if (!user.googleId) {
        user.googleId = payload.sub;
        changed = true;
      }
      if (!user.avatarUrl && payload.picture) {
        user.avatarUrl = payload.picture;
        changed = true;
      }
      if (changed) await user.save();
    }

    if (user.isLocked) {
      throw AppError.forbidden("Tai khoan cua ban da bi khoa", "ACCOUNT_LOCKED");
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
