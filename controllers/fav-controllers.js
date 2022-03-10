const User = require("../models/user");
const Journey = require("../models/journey");
const Post = require("../models/post");
const Exp = require("../models/exp");
const ExpressError = require("../utils/ExpressError");
const ItemTypes = require("./item-types");

module.exports.getUserFavs = async (req, res, next) => {
  const { userId } = req.userData;

  let user;
  try {
    user = await User.findById(userId).select([
      "favPosts",
      "favUsers",
      "favJourneys",
      "favExps",
      'profileImage',
      'username'
    ]);
  } catch (err) {
    const error = new ExpressError(
      "Fetching user failed, please try again later.",
      500
    );
    return next(error);
  }

  if (!user) {
    return next(new ExpressError("Could not find user.", 404));
  }

  res.json({ user });
};

module.exports.addItemToFavs = async (req, res, next) => {
  const { userId } = req.userData;
  const itemType = req.query.type;
  const { itemId } = req.body;

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

 let item = { item: itemId, added: Date.now() };
  const arrayName = "fav" + itemType[0].toUpperCase() + itemType.slice(1) + "s";
  if (user[arrayName].find((el) => el.item === itemId)) {
    const error = new ExpressError("Item is already in favorites.", 403);
    return next(error);
  }
  
  try {
    user[arrayName].push(item);
    await user.save();
  } catch (err) {
    const error = new ExpressError("Saving item failed.", 500);
    return next(error);
  }

  res.status(201).json({ item });
};

module.exports.removeItemFromFavs = async (req, res, next) => {
  const { userId } = req.userData;
  const itemType = req.query.type;
  const { itemId } = req.body;

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
  const arrayName = "fav" + itemType[0].toUpperCase() + itemType.slice(1) + "s";

  await User.findByIdAndUpdate(user, {
    $pull: { [arrayName]: { item: itemId } },
  });
  res.status(200).json({ msg: "Successfully removed" });
};

module.exports.clearDeletedFav = async (req, res, next) => {
  const { userId } = req.userData;
  const itemType = req.query.type;
  const { itemId } = req.body;

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
  const arrayName = "fav" + itemType[0].toUpperCase() + itemType.slice(1) + "s";

  await User.findByIdAndUpdate(user, {
    $pull: { [arrayName]: { _id: itemId } },
  });
  res.status(200).json({ msg: "Successfully removed" });
};
