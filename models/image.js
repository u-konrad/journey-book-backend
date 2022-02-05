const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ImageSchema = new Schema({
  path: String,
  filename: String,
});

ImageSchema.virtual("round").get(function () {
  return this.path.replace("/upload", "/upload/w_200,h_200,c_fill,r_max");
});

module.exports = ImageSchema;
