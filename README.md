# Chạm Xanh - Web Admin 2 (Monolithic)

Backend trung tâm + trang quản trị **gộp trong 1 service duy nhất** (kiểu repo ChamXanh).
Node.js + Express + MongoDB (Mongoose) + Socket.IO. Phục vụ:

- **App Mobile Chạm Xanh** (toàn bộ API: auth, plants, articles, posts, user-plants, chat, users, uploads).
- **Trang quản trị** tại `/admin` (HTML/CSS/JS thuần) để đăng bài viết Khám phá, quản lý cây, người dùng.
- **Realtime**: thêm/sửa/xoá bài viết hoặc cây → app đang mở tự cập nhật (Socket.IO).

## Cấu trúc (giống ChamXanh)

```
server.js         # entry: express + socket.io + serve public
db.js             # ket noi MongoDB
socket.js         # Socket.IO + emitPublic/emitToUser
seed.js           # tao du lieu mau
middleware/       # auth.js, errorHandler.js, upload.js
models/           # User, Plant, Article, Post, UserPlant, ChatMessage
routes/           # auth, plants, articles, categories, posts, users, chat, userPlants, uploads, admin
public/           # index.html, admin.html, css/, js/, uploads/
```

## Chạy local

```bash
cp .env.example .env      # sua MONGODB_URI, JWT_SECRET
npm install
npm run seed              # tao admin@chamxanh.vn / admin123 + du lieu mau
npm start                 # http://localhost:4000  |  admin: http://localhost:4000/admin
```

## Deploy lên Render (BE + FE chung 1 service)

1. Đẩy thư mục này lên 1 GitHub repo.
2. Render → **New + → Web Service** → chọn repo.
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance: **Free**
3. Environment Variables:
   - `MONGODB_URI` = connection string MongoDB Atlas M0 (512MB free) — dữ liệu KHÔNG mất khi server ngủ.
   - `JWT_SECRET`, `JWT_REFRESH_SECRET` = chuỗi ngẫu nhiên dài.
   - `ALLOWED_ORIGINS` = để trống (hoặc domain web nếu muốn siết).
4. Sau khi deploy: `https://<app>.onrender.com/api/health` → `{"status":"ok"}`, và `/admin` để đăng nhập.

## Kết nối App Mobile

Trong `Mobile/.env`:

```
EXPO_PUBLIC_API_BASE_URL=https://<app>.onrender.com/api
```

App sẽ gọi API và mở socket tới server này. Bài viết bạn đăng ở `/admin` xuất hiện realtime trong phần Khám phá.

## Hợp đồng realtime (không đổi tên sự kiện)

| Sự kiện | Payload |
|---|---|
| `article:created` / `article:updated` | full Article |
| `article:deleted` | `{ _id }` |
| `plant:created` / `plant:updated` | full Plant |
| `plant:deleted` | `{ _id }` |
| `user-plant:created` / `:updated` | full UserPlant |
| `user-plant:deleted` | `{ _id }` |

## Lưu ý

- **Ảnh bìa dùng URL** (không upload file) để không mất khi Render Free ngủ. Endpoint `/api/uploads` chỉ dành cho app.
- Server free ngủ sau 15 phút không dùng; lần gọi đầu sau đó chậm ~30-50s (dữ liệu vẫn còn).

Tài khoản mẫu: `admin@chamxanh.vn / admin123` · `user@chamxanh.vn / user123`
