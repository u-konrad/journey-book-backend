const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
  author: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  posted: Number,
  item: {
    type: Schema.Types.ObjectId,
  },
  content:String
});

module.exports = mongoose.model("Comment", CommentSchema);
