const bcrypt = require("bcryptjs");
const { User } = require("./models/User");
const { Plant } = require("./models/Plant");
const { Article } = require("./models/Article");

// Tu khoi tao du lieu can thiet luc server start (idempotent):
// - Luon dam bao co 1 tai khoan admin de dang nhap trang quan tri.
// - Chi seed cay/bai viet mau khi collection dang RONG (tranh trung lap).
// Chay tren moi moi truong (ke ca Render) noi DNS toi Atlas hoat dong,
// nen khong can chay `npm run seed` thu cong tu may local.
async function bootstrap() {
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@chamxanh.vn").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  const existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await User.create({
      name: "Admin Cham Xanh",
      email: adminEmail,
      passwordHash,
      role: "admin",
      gardenName: "Vuon quan tri",
    });
    console.log(`[BOOTSTRAP] Da tao tai khoan admin: ${adminEmail}`);
  } else {
    console.log(`[BOOTSTRAP] Tai khoan admin da ton tai: ${adminEmail}`);
  }

  const plantCount = await Plant.countDocuments();
  if (plantCount === 0) {
    await Plant.insertMany([
      {
        name: "Cay Luoi Ho",
        scientificName: "Sansevieria trifasciata",
        description: "De trong, chiu han tot, thanh loc khong khi hieu qua.",
        careLevel: "easy",
        light: "Anh sang giao tan hoac bong ram",
        water: "Tuoi 1-2 lan/tuan",
        category: "phong-ngu",
        isMedicinal: false,
        tags: ["thanh loc khong khi", "de trong"],
        viewCount: 12,
      },
      {
        name: "Cay Nha Dam",
        scientificName: "Aloe vera",
        description: "Co the dung gel de duong da, chua bong nhe.",
        careLevel: "easy",
        light: "Anh sang tot",
        water: "Tuoi khi dat kho hoan toan",
        category: "rau-cu-chua-benh",
        isMedicinal: true,
        tags: ["duoc lieu", "lam dep"],
        viewCount: 20,
      },
      {
        name: "Cay Kim Tien",
        scientificName: "Zamioculcas zamiifolia",
        description: "Bieu tuong may man, phu hop de ban lam viec.",
        careLevel: "easy",
        light: "Anh sang gian tiep",
        water: "Tuoi 1 lan/tuan",
        category: "ban-lam-viec",
        isMedicinal: false,
        tags: ["phong thuy", "van phong"],
        viewCount: 8,
      },
    ]);
    console.log("[BOOTSTRAP] Da seed cay mau (collection dang rong)");
  }

  const articleCount = await Article.countDocuments();
  if (articleCount === 0) {
    await Article.insertMany([
      {
        title: "Phan huu co tu rac nha bep",
        content:
          "Huong dan cach u phan huu co tu rac thai nha bep nhu vo trai cay, ba tra, vo trung... giup cay trong xanh tot ma khong can hoa chat.",
        coverImageUrl: "",
        tags: ["phan bon", "huu co"],
        published: true,
      },
    ]);
    console.log("[BOOTSTRAP] Da seed bai viet mau (collection dang rong)");
  }
}

module.exports = { bootstrap };
