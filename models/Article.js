const { Schema, model } = require("mongoose");

// Bai viet phan "Kham pha" - do Admin dang trong trang web admin nay.
// App Mobile (ArticleDetailScreen) doc: title, coverImageUrl, content, createdAt.
const articleSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    // Anh bia luu duoi dang URL (khuyen nghi cho Render Free - khong mat khi ngu).
    coverImageUrl: { type: String, default: "" },
    tags: [{ type: String }],
    // Ban nhap: true = an voi app, chi hien khi da xuat ban.
    published: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

articleSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id ? ret._id.toString() : ret.id;
    delete ret.__v;
    return ret;
  },
});

module.exports = { Article: model("Article", articleSchema) };
