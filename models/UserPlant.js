const { Schema, model } = require("mongoose");

const reminderSchema = new Schema(
  {
    enabled: { type: Boolean, default: false },
    wateringIntervalDays: { type: Number, default: 3 },
    fertilizingIntervalDays: { type: Number, default: 30 },
    notifyTime: { type: String, default: "07:00" },
  },
  { _id: false }
);

const userPlantSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  plantId: { type: Schema.Types.ObjectId, ref: "Plant", required: false },
  customName: { type: String, required: true, trim: true },
  photoUrl: { type: String, required: true },
  // 'indoor' | 'desk' | 'balcony' | 'garden' | 'other' - khop Mobile constants/spaces.ts
  space: { type: String, default: "" },
  // 'foliage' | 'flowering' | 'cactus' | 'herbs' | 'woody' | 'other'
  plantGroup: { type: String, default: "" },
  // 'direct' | 'indirect' | 'shade'
  light: { type: String, default: "" },
  reminder: { type: reminderSchema, default: () => ({}) },
  addedAt: { type: Date, default: Date.now },
});

userPlantSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id ? ret._id.toString() : ret.id;
    delete ret.__v;
    return ret;
  },
});

module.exports = { UserPlant: model("UserPlant", userPlantSchema) };
