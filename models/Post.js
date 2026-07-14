const { Schema, model } = require("mongoose");

const postSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    userPlantId: { type: Schema.Types.ObjectId, ref: "UserPlant", required: false },
    imageUrl: { type: String, required: true },
    caption: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

postSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id ? ret._id.toString() : ret.id;
    delete ret.__v;
    return ret;
  },
});

module.exports = { Post: model("Post", postSchema) };
