const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");

// Singleton giu tren module de tranh circular import: cac route chi goi
// emitPublic(...) / emitToUser(...). Hop dong su kien PHAI khop Mobile
// (src/hooks/useRealtimeSync.ts), khong duoc doi ten:
//   plant:created / plant:updated       -> full Plant
//   plant:deleted                       -> { _id }
//   article:created / article:updated   -> full Article
//   article:deleted                     -> { _id }
//   user-plant:created / :updated       -> full UserPlant
//   user-plant:deleted                  -> { _id }
let io = null;

function initSocket(httpServer) {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        callback(new Error("Origin khong duoc phep boi CORS"));
      },
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    // Client gui JWT qua socket.handshake.auth.token de join room rieng.
    // Thieu/sai token van cho connect (khong crash) - chi la khong join room.
    try {
      const token = socket.handshake.auth && socket.handshake.auth.token;
      if (token) {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        if (payload && payload.id) {
          socket.join(`user:${payload.id}`);
        }
      }
    } catch (_err) {
      // bo qua token khong hop le - client van ket noi nhan su kien public
    }
  });

  return io;
}

function getIO() {
  return io;
}

// Phat su kien public cho moi client dang ket noi (khong can auth).
function emitPublic(event, payload) {
  if (io) io.emit(event, payload);
}

// Phat su kien rieng cho 1 user (moi thiet bi da join room 'user:<userId>').
function emitToUser(userId, event, payload) {
  if (io) io.to(`user:${userId}`).emit(event, payload);
}

module.exports = { initSocket, getIO, emitPublic, emitToUser };
