const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ImageSchema = require('./image')

const JourneySchema = new Schema({
  itemType:{ type: String, default: 'journey' },
  title: { type: String, required: true },
  content:String,
  location:String,
  coordinates:[Number],
  when:String,
  posted: Number,
  edited: Number,
  author: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  image:ImageSchema,
  authorName:String,
  posts: [{ type: Schema.Types.ObjectId, ref: "Post" }],
  exps: [{ type: Schema.Types.ObjectId, ref: "Exp" }]
});

JourneySchema.index({title: 'text', location: 'text'});


module.exports = mongoose.model("Journey", JourneySchema);
