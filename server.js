require("dotenv").config();

const fs = require("fs");
const http = require("http");
const path = require("path");
const cors = require("cors");
const express = require("express");

const { connectDB } = require("./db");
const { initSocket } = require("./socket");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

const authRoutes = require("./routes/auth");
const plantRoutes = require("./routes/plants");
const articleRoutes = require("./routes/articles");
const categoryRoutes = require("./routes/categories");
const userPlantRoutes = require("./routes/userPlants");
const postRoutes = require("./routes/posts");
const userRoutes = require("./routes/users");
const chatRoutes = require("./routes/chat");
const uploadRoutes = require("./routes/uploads");
const adminRoutes = require("./routes/admin");

function createApp() {
  const app = express();

  const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  app.use(
    cors({
      // Khong co Origin header (app mobile, curl, server-to-server) -> luon cho.
      // Request tu trinh duyet -> chi cho origin trong ALLOWED_ORIGINS (rong = cho tat ca).
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        callback(new Error("Origin khong duoc phep boi CORS"));
      },
      credentials: true,
    })
  );

  app.use(express.json({ limit: "5mb" }));
  app.use(express.urlencoded({ extended: true }));

  // File tinh (anh upload): /uploads/<filename>
  const publicDir = path.join(__dirname, "public");
  app.use("/uploads", express.static(path.join(publicDir, "uploads")));

  app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "cham-xanh-admin" }));

  app.use("/api/auth", authRoutes);
  app.use("/api/plants", plantRoutes);
  app.use("/api/articles", articleRoutes);
  app.use("/api/categories", categoryRoutes);
  app.use("/api/user-plants", userPlantRoutes);
  app.use("/api/posts", postRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/chat", chatRoutes);
  app.use("/api/uploads", uploadRoutes);
  app.use("/api/admin", adminRoutes);

  // Trang admin: /admin -> public/admin.html
  app.get("/admin", (_req, res) => res.sendFile(path.join(publicDir, "admin.html")));

  // File tinh cua trang admin + landing (index.html o root).
  if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));
  }

  // 404 chi ap dung cho /api va /uploads. Cac duong dan khac tra ve landing.
  app.use("/api", notFoundHandler);
  app.use("/uploads", notFoundHandler);
  app.get(/^(?!\/api|\/uploads).*/, (_req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });

  app.use(errorHandler);
  return app;
}

const PORT = process.env.PORT || 4000;

async function main() {
  await connectDB();
  const app = createApp();
  const server = http.createServer(app);
  initSocket(server);
  server.listen(PORT, () => {
    console.log(`[Cham Xanh Admin] Dang chay tai http://localhost:${PORT}`);
    console.log(`[Cham Xanh Admin] Trang quan tri: http://localhost:${PORT}/admin`);
  });
}

main().catch((err) => {
  console.error("[FATAL] Khong the khoi dong server:", err);
  process.exit(1);
});
