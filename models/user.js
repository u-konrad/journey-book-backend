const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ImageSchema = require("./image");

const opts = {
  toJSON: { virtuals: true },
  toObject: {
    virtuals: true,
  },
};

const UserSchema = new Schema(
  {
    itemType: { type: String, default: "user" },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    about: String,
    blogTitle: String,
    blogDesc: String,
    image: ImageSchema,
    profileImage: ImageSchema,
    posts: [{ type: Schema.Types.ObjectId, ref: "Post" }],
    journeys: [{ type: Schema.Types.ObjectId, ref: "Journey" }],
    exps: [{ type: Schema.Types.ObjectId, ref: "Exp" }],
    favPosts: [
      { item: { type: Schema.Types.ObjectId, ref: "Post" }, added: Number },
    ],
    favJourneys: [
      {
        item: { type: Schema.Types.ObjectId, ref: "Journey" },
        added: Number,
      },
    ],
    favExps: [
      { item: { type: Schema.Types.ObjectId, ref: "Exp" }, added: Number },
    ],
    favUsers: [
      {
        item: { type: Schema.Types.ObjectId, ref: "User" },
        added: Number,
      },
    ],
  },
  opts
);

UserSchema.virtual("postNum").get(function () {
  if (this.posts) {
    return this.posts.length;
  } else {
    return NaN;
  }
});

UserSchema.virtual("journeyNum").get(function () {
  if (this.journeys) {
    return this.journeys.length;
  } else {
    return NaN;
  }
});

UserSchema.virtual("expNum").get(function () {
  if (this.exps) {
    return this.exps.length;
  } else {
    return NaN;
  }
});

module.exports = mongoose.model("User", UserSchema);
