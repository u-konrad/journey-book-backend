const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ImageSchema = require("./image");

const ExpSchema = new Schema({
  itemType: { type: String, default: "exp" },
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
  coordinates: [Number],
  journey: {
    type: Schema.Types.ObjectId,
    ref: "Journey",
  },
  rating: Number,
  category: String,
  image: ImageSchema,
});

ExpSchema.index({ title: "text", location: "text" });

module.exports = mongoose.model("Exp", ExpSchema);
