const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ImageSchema = require("./image");
const cloudinary = require("cloudinary").v2;

const PostSchema = new Schema({
  itemType: { type: String, default: "post" },
  title: { type: String, required: true },
  content: { type: String, required: true },
  posted: Number,
  edited: Number,
  author: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  authorName: String,
  location: String,
  journey: {
    type: Schema.Types.ObjectId,
    ref: "Journey",
  },
  image: ImageSchema,
  coordinates: [Number],
  comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
});

PostSchema.post("remove", async function (doc) {
  if (doc?.image.filename) {
    await cloudinary.uploader.destroy(doc.image.filename);
  }
});

PostSchema.index({ title: "text", location: "text" });

module.exports = mongoose.model("Post", PostSchema);
