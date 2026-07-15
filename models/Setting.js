const { Schema, model } = require("mongoose");

// Kho luu cau hinh dang key/value (singleton theo key).
// Dung cho cac gia tri Admin chinh sua duoc va App doc realtime,
// vi du: tieu de muc bai viet ("tieu de hom nay") tren man Kham pha.
const settingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    value: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

settingSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id ? ret._id.toString() : ret.id;
    delete ret.__v;
    return ret;
  },
});

module.exports = { Setting: model("Setting", settingSchema) };
