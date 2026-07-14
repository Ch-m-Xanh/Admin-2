const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Thieu bien moi truong MONGODB_URI");
  }
  await mongoose.connect(uri);
  console.log("[DB] Ket noi MongoDB thanh cong");
}

module.exports = { connectDB };
