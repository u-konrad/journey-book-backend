const User = require("../models/user");
const Journey = require("../models/journey");
const Post = require("../models/post");
const Exp = require("../models/exp");
const Comment =require('../models/comment')

const ExpressError = require("../utils/ExpressError");
const ItemTypes = require("./item-types");
const cloudinary = require("cloudinary").v2;
const { paginationPipeline } = require("../pipeline");

module.exports.getItemById = async (req, res, next) => {
  const { itemId } = req.params;
  const itemType = req.query.type;

  let item;
  if (itemType === ItemTypes.JOURNEYS) {
    item = await Journey.findById(itemId).populate([
      "posts",
      "exps",
      "comments",
    ]);
  } else if (itemType === ItemTypes.POSTS) {
    item = await Post.findById(itemId).populate(["journey", "comments"]);
  } else if (itemType === ItemTypes.EXPS) {
    item = await Exp.findById(itemId).populate(["journey", "comments"]);
  } else {
    const error = new ExpressError("Missing or wrong item type.", 400);
    return next(error);
  }

  if (!item) {
    const error = new ExpressError("Could not find item for this id.", 404);
    return next(error);
  }

  res.status(200).json({ item });
};

module.exports.addNewItem = async (req, res, next) => {
  const { userId } = req.userData;
  const itemType = req.query.type;

  const item = req.body;

  let image;
  if (req.file) {
    image = {
      path: req.file.path,
      filename: req.file.filename,
    };
  } else if (req.body.image) {
    image = JSON.parse(req.body.image);
  }

  let user;
  try {
    user = await User.findById(userId);
  } catch (err) {
    const error = new ExpressError(
      "Retrieving user failed, please try again.",
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new ExpressError("Could not find user for provided id.", 404);
    return next(error);
  }

  const newItem = {
    ...item,
    coordinates:
      !!item.coordinates && item.coordinates !== "undefined"
        ? item.coordinates.split(",")
        : [],
    author: userId,
    authorName: user.username,
    posted: Date.now(),
    image: image,
  };

  let itemToSave;
  if (itemType === ItemTypes.JOURNEYS) {
    itemToSave = await new Journey({ ...newItem });
  } else if (itemType === ItemTypes.POSTS) {
    itemToSave = await new Post({ ...newItem });
  } else if (itemType === ItemTypes.EXPS) {
    itemToSave = await new Exp({ ...newItem });
  } else {
    const error = new ExpressError("Missing or wrong item type.", 400);
    return next(error);
  }

  let journey;

  if (itemToSave.journey) {
    try {
      journey = await Journey.findById(itemToSave.journey);
    } catch (err) {
      const error = new ExpressError(
        "Retrieving journey failed, please try again.",
        500
      );
    }
    if (!journey) {
      const error = new ExpressError(
        "Could not find journey for provided id.",
        404
      );
      return next(error);
    }
  }

  const arrayName = itemType + "s";
  try {
    await itemToSave.save();
    user[arrayName].push(itemToSave);
    await user.save();
    if (itemToSave.journey) {
      await journey[arrayName].push(itemToSave);
      await journey.save();
    }
  } catch (err) {
    const error = new ExpressError(
      "Creating item failed, please try again.",
      500
    );
    return next(error);
  }
  return res.status(201).json({ item });
};

module.exports.updateItem = async (req, res, next) => {
  const { itemId } = req.params;
  const itemType = req.query.type;
  const isProfileUpdate = req.query.profile;

  let image;
  if (req.file) {
    image = {
      path: req.file.path,
      filename: req.file.filename,
    };
  } else if (req.body.image) {
    image = JSON.parse(req.body.image);
  }

  const payload = { ...req.body };
  if (
    (itemType === ItemTypes.POSTS || itemType === ItemTypes.EXPS) &&
    !payload.journey
  ) {
    payload.journey = null;
  }
  if (payload.image) delete payload.image;
  const coordinates = payload.coordinates ? payload.coordinates.split(",") : [];

  let updateObj;
  if (!isProfileUpdate) {
    updateObj = { ...payload, coordinates, image };
  } else {
    updateObj = { ...payload, coordinates, profileImage: image };
  }

  let item;
  try {
    if (itemType === ItemTypes.JOURNEYS) {
      item = await Journey.findByIdAndUpdate(itemId, { ...updateObj });
    } else if (itemType === ItemTypes.POSTS) {
      item = await Post.findByIdAndUpdate(itemId, { ...updateObj });
    } else if (itemType === ItemTypes.EXPS) {
      item = await Exp.findByIdAndUpdate(itemId, { ...updateObj });
    } else if (itemType === ItemTypes.USERS) {
      item = await User.findByIdAndUpdate(itemId, { ...updateObj });
    } else {
      const error = new ExpressError("Missing or wrong item type.", 400);
      return next(error);
    }
  } catch (err) {
    const error = new ExpressError("Error updating item.", 500);
    return next(error);
  }

  if (!item) {
    const error = new ExpressError("Could not find item for this id.", 404);
    return next(error);
  }

  try {
    const arrayName = itemType + "s";
    if (payload.journey?.toString() !== item.journey?.toString()) {
      if (payload.journey) {
        await Journey.findByIdAndUpdate(payload.journey, {
          $push: { [arrayName]: itemId },
        });
      }
      if (item.journey) {
        await Journey.findByIdAndUpdate(item.journey, {
          $pull: { [arrayName]: itemId },
        });
      }
    }
  } catch (err) {
    const error = new ExpressError("Error updating journeys.", 500);
    return next(error);
  }

  try {
    if (
      item.image?.filename &&
      image?.filename &&
      item.image.filename !== image.filename
    ) {
      if (!isProfileUpdate) {
        if (item.image?.filename) {
          await cloudinary.uploader.destroy(item.image.filename);
        }
      } else {
        if (item.profileImage?.filename) {
          await cloudinary.uploader.destroy(item.profileImage.filename);
        }
      }
    }
  } catch (err) {
    const error = new ExpressError("Error deleting photos.", 500);
    return next(error);
  }

  res.status(200).json({ updated: updateObj });
};

module.exports.deleteItem = async (req, res, next) => {
  const { itemId } = req.params;
  const { userId } = req.userData;
  const itemType = req.query.type;

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

  if (item.author.toString() !== userId) {
    const error = new ExpressError(
      "You are not authorized to delete this item.",
      403
    );
    return next(error);
  }
  const arrayName = itemType + "s";
  try {
    await User.findByIdAndUpdate(userId, {
      $pull: { [arrayName]: itemId },
    });
    if (item.journey) {
      await Journey.findByIdAndUpdate(item.journey.toString(), {
        $pull: { [arrayName]: itemId },
      });
    }
    if (item.image && item.image.filename) {
      await cloudinary.uploader.destroy(item.image.filename);
    }
    if (itemType === ItemTypes.JOURNEYS) {
      const { posts, exps } = item;
      await item.populate(["posts", "exps"]);
      const images = [...item.posts, ...item.exps]
        .filter((item) => !!item.image?.filename)
        .map((item) => item.image.filename);

      await Post.deleteMany({ _id: { $in: posts } });
      await Exp.deleteMany({ _id: { $in: exps } });

      images.forEach(async (filename) => {
        await cloudinary.uploader.destroy(filename);
      });
    }
    if (item.comments) {
      const { comments } = item;
      await Comment.deleteMany({ _id: { $in: comments } });
    }
    await item.remove();
  } catch (err) {
    const error = new ExpressError(
      "Something went wrong, could not delete item.",
      500
    );
    return next(error);
  }
  return res.status(200).json({ msg: "Successfully deleted" });
};

module.exports.getAllItems = async (req, res, next) => {
  const { type: itemType, q: query, page, size } = req.query;

  const offset = page * size;

  let items;
  if (itemType === ItemTypes.JOURNEYS) {
    items = await Journey.find({})
      .sort({ posted: -1 })
      .skip(offset)
      .limit(parseInt(size));
  } else if (itemType === ItemTypes.POSTS) {
    items = await Post.find({})
      .sort({ posted: -1 })
      .skip(offset)
      .limit(parseInt(size));
  } else if (itemType === ItemTypes.EXPS) {
    items = await Exp.find({})
      .sort({ posted: -1 })
      .skip(offset)
      .limit(parseInt(size));
  } else {
    const error = new ExpressError("Missing or wrong item type.", 400);
    return next(error);
  }

  res.status(200).json({ items });
};

module.exports.getItemsByQuery = async (req, res, next) => {
  const { type: itemType, q: query, page, size } = req.query;

  const offset = page * size;

  if (!query) {
    const error = new ExpressError("Missing query.", 400);
    return next(error);
  }

  let result;
  try {
    if (itemType === ItemTypes.JOURNEYS) {
      result = await Journey.aggregate(
        paginationPipeline(query, offset, +size)
      );
    } else if (itemType === ItemTypes.POSTS) {
      result = await Post.aggregate(paginationPipeline(query, offset, +size));
    } else if (itemType === ItemTypes.EXPS) {
      result = await Exp.aggregate(paginationPipeline(query, offset, +size));
    } else {
      const error = new ExpressError("Missing or wrong item type.", 400);
      return next(error);
    }
  } catch (err) {
    const error = new ExpressError("Error accessing items.", 500);
    return next(error);
  }

  let items = [];
  let count = 0;
  if (result[0]) {
    items = result[0].items;
    count = result[0].count;
  }

  res.status(200).json({ items, count });
};
