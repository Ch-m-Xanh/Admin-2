const { Router } = require("express");
const { ChatMessage } = require("../models/ChatMessage");
const { asyncHandler } = require("../utils/asyncHandler");
const { AppError } = require("../utils/AppError");
const { requireAuth } = require("../middleware/auth");

const router = Router();
router.use(requireAuth);

// TODO(LLM): thay ham nay bang cuoc goi toi LLM that (vi du Claude API) de
// tra loi tu nhien hon. Hien tai la rule-based mock theo tu khoa.
function getMockBotReply(userText) {
  const text = String(userText).toLowerCase();
  if (text.includes("tuoi nuoc") || text.includes("tưới nước") || text.includes("nuoc")) {
    return "Ban nen tuoi nuoc cho cay 2-3 lan/tuan, kiem tra do am dat truoc khi tuoi de tranh ung nuoc.";
  }
  if (text.includes("anh sang") || text.includes("ánh sáng") || text.includes("nang")) {
    return "Hau het cay canh ua anh sang giao tan (indirect light). Tranh de cay duoi nang gat truc tiep qua lau.";
  }
  if (text.includes("sau benh") || text.includes("sâu bệnh") || text.includes("benh")) {
    return "Neu la cay co dau hieu sau benh, ban co the dung dung dich xa phong loang hoac dau neem de xu ly tu nhien.";
  }
  if (text.includes("phan bon") || text.includes("bón phân") || text.includes("bon")) {
    return "Nen bon phan huu co dinh ky 2-4 tuan/lan trong mua sinh truong, tranh bon qua lieu gay chay re.";
  }
  return "Cam on ban da nhan tin! Minh la tro ly cham soc cay Cham Xanh. Ban co the hoi minh ve tuoi nuoc, anh sang, sau benh hoac phan bon nhe.";
}

router.get(
  "/messages",
  asyncHandler(async (req, res) => {
    const messages = await ChatMessage.find({ userId: req.user.id }).sort({ createdAt: 1 });
    res.json({ messages });
  })
);

router.post(
  "/messages",
  asyncHandler(async (req, res) => {
    const { text } = req.body || {};
    if (!text || String(text).trim() === "") {
      throw AppError.validation("Noi dung tin nhan khong duoc de trong");
    }
    const userMessage = await ChatMessage.create({
      userId: req.user.id,
      sender: "user",
      text,
    });
    const botMessage = await ChatMessage.create({
      userId: req.user.id,
      sender: "bot",
      text: getMockBotReply(text),
    });
    res.status(201).json({ userMessage, botMessage });
  })
);

module.exports = router;
