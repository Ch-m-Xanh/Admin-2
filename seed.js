require("dotenv").config();

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { connectDB } = require("./db");
const { User } = require("./models/User");
const { Plant } = require("./models/Plant");
const { Article } = require("./models/Article");

async function seed() {
  await connectDB();

  console.log("[SEED] Xoa du lieu cu...");
  await Promise.all([User.deleteMany({}), Plant.deleteMany({}), Article.deleteMany({})]);

  console.log("[SEED] Tao user mau...");
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const userPasswordHash = await bcrypt.hash("user123", 10);

  const admin = await User.create({
    name: "Admin Cham Xanh",
    email: "admin@chamxanh.vn",
    passwordHash: adminPasswordHash,
    role: "admin",
    gardenName: "Vuon quan tri",
  });

  const demoUser = await User.create({
    name: "Nguyen Van A",
    email: "user@chamxanh.vn",
    passwordHash: userPasswordHash,
    role: "user",
    gardenName: "Vuon nho cua A",
  });

  console.log("[SEED] Tao cay mau...");
  await Plant.insertMany([
    {
      name: "Cay Luoi Ho",
      scientificName: "Sansevieria trifasciata",
      description: "De trong, chiu han tot, thanh loc khong khi hieu qua.",
      careLevel: "easy",
      light: "Anh sang giao tan hoac bong ram",
      water: "Tuoi 1-2 lan/tuan",
      category: "phong-ngu",
      images: [],
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
      images: [],
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
      images: [],
      isMedicinal: false,
      tags: ["phong thuy", "van phong"],
      viewCount: 8,
    },
    {
      name: "Cay Bac Ha",
      scientificName: "Mentha",
      description: "Thom mat, dung lam gia vi va tra thao moc.",
      careLevel: "medium",
      light: "Nhieu anh sang",
      water: "Tuoi thuong xuyen, giu am dat",
      category: "phong-bep",
      images: [],
      isMedicinal: true,
      tags: ["gia vi", "thao moc"],
      viewCount: 5,
    },
    {
      name: "Cay Trau Ba",
      scientificName: "Epipremnum aureum",
      description: "Cay leo de cham soc, thanh loc khong khi tot.",
      careLevel: "easy",
      light: "Anh sang thap den trung binh",
      water: "Tuoi khi lop dat mat kho",
      category: "phong-khach",
      images: [],
      isMedicinal: false,
      tags: ["thanh loc khong khi", "trang tri"],
      viewCount: 15,
    },
  ]);

  console.log("[SEED] Tao bai viet mau...");
  await Article.insertMany([
    {
      title: "Phan huu co tu rac nha bep",
      content:
        "Huong dan cach u phan huu co tu rac thai nha bep nhu vo trai cay, ba tra, vo trung... giup cay trong xanh tot ma khong can hoa chat.",
      coverImageUrl: "",
      tags: ["phan bon", "huu co"],
      published: true,
    },
    {
      title: "5 loai cay de trong nhat cho nguoi moi bat dau",
      content:
        "Danh sach cac loai cay chiu duoc dieu kien cham soc it, phu hop cho nguoi moi bat dau lam vuon.",
      coverImageUrl: "",
      tags: ["cay de trong", "nguoi moi"],
      published: true,
    },
  ]);

  console.log("[SEED] Hoan tat!");
  console.log(`Admin: admin@chamxanh.vn / admin123 (id=${admin._id})`);
  console.log(`User:  user@chamxanh.vn / user123 (id=${demoUser._id})`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("[SEED] Loi:", err);
  process.exit(1);
});
