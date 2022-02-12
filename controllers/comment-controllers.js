const Journey = require("../models/journey");
const Post = require("../models/post");
const Exp = require("../models/exp");
const Comment = require("../models/comment");
const ItemTypes = require("./item-types");
const ExpressError = require("../utils/ExpressError");

module.exports.getCommentsById = async (req, res, next) => {
  const { itemId } = req.params;
  const itemType = req.query.type;

  let item;
  if (itemType === ItemTypes.JOURNEYS) {
    item = await Journey.findById(itemId).populate({
      path: "comments",
      populate: {
        path: "author",
        select: ["username", "_id"],
      },
    });
  } else if (itemType === ItemTypes.POSTS) {
    item = await Post.findById(itemId).populate("comments");
  } else if (itemType === ItemTypes.EXPS) {
    item = await Exp.findById(itemId).populate("comments");
  } else {
    const error = new ExpressError("Missing or wrong item type.", 400);
    return next(error);
  }

  if (!item) {
    const error = new ExpressError("Could not find item for this id.", 404);
    return next(error);
  }

  const comments = item.comments || [];

  res.status(200).json({ comments });
};

module.exports.addNewComment = async (req, res, next) => {
  const { itemId } = req.params;
  const itemType = req.query.type;

  console.log(req.body);

  const comment = { ...req.body };
  const newComment = await new Comment({
    ...comment,
    posted: Date.now(),
    item: itemId,
  });

  let item;
  if (itemType === ItemTypes.JOURNEYS) {
    item = await Journey.findById(itemId);
  } else if (itemType === ItemTypes.POSTS) {
    item = await Post.findById(itemId);
  } else if (itemType === ItemTypes.EXPS) {
    item = await Exp.findById(itemId);
  } else {
    const error = new ExpressError("Missing or wrong item type.", 400);
    return next(error);
  }

  if (!item) {
    const error = new ExpressError("Could not find item for this id.", 404);
    return next(error);
  }

  if (!item.comments) {
    item.comments = [];
  }

  try {
    await newComment.save();
    item.comments.push(newComment);
    await item.save();
  } catch (err) {
    const error = new ExpressError(
      "Creating item failed, please try again.",
      500
    );
    return next(error);
  }

  return res.status(201).json({ comment: newComment });
};
