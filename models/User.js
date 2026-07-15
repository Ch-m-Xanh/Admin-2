const { Schema, model } = require("mongoose");

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Optional: tai khoan dang nhap bang Google se khong co mat khau.
    passwordHash: { type: String },
    // Google subject id (`sub`) — dinh danh on dinh cho tai khoan Google.
    googleId: { type: String, index: true, sparse: true },
    avatarUrl: { type: String, default: "" },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    gardenName: { type: String, default: "" },
    gardenDescription: { type: String, default: "" },
    followerIds: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
    followingIds: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
    isLocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Khong bao gio gui passwordHash ra client. Them `id` cho tien FE.
userSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id ? ret._id.toString() : ret.id;
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

module.exports = { User: model("User", userSchema) };
