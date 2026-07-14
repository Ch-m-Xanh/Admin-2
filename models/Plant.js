const { Schema, model } = require("mongoose");

const plantSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    scientificName: { type: String, default: "" },
    description: { type: String, default: "" },
    careLevel: { type: String, enum: ["easy", "medium", "hard"], default: "easy" },
    light: { type: String, default: "" },
    water: { type: String, default: "" },
    // De dang chuoi tu do, cac gia tri thuong gap:
    // 'phong-ngu' | 'ban-lam-viec' | 'phong-bep' | 'rau-cu-chua-benh' ...
    category: { type: String, required: true, index: true },
    images: [{ type: String }],
    isMedicinal: { type: Boolean, default: false },
    tags: [{ type: String }],
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

plantSchema.index({ name: "text", description: "text", tags: "text" });

// Mobile doc raw._id ?? raw.id va raw.imageUrl ?? raw.images[0].
// Expose `id` + `imageUrl` cho tien ca app lan trang admin.
plantSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id ? ret._id.toString() : ret.id;
    ret.imageUrl = Array.isArray(ret.images) && ret.images.length ? ret.images[0] : null;
    delete ret.__v;
    return ret;
  },
});

module.exports = { Plant: model("Plant", plantSchema) };
