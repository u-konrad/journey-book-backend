const User = require("../models/user");
const Journey = require("../models/journey");
const Post = require("../models/post");
const Exp = require("../models/exp");
const ExpressError = require("../utils/ExpressError");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const ItemTypes = require("./item-types");
const cloudinary = require("cloudinary").v2;

const convertDeletedFavs = (user, arrayName, itemType) => {
  if (user[arrayName]) {
    return user[arrayName].map((element) => {
      if (element.item) {
        return element;
      } else {
        return {
          itemType,
          added: element.added,
          _id: element._id,
          deleted: true,
        };
      }
    });
  } else {
    return [];
  }
};

module.exports.register = async (req, res, next) => {
  const { email, username, password } = req.body;

  try {
    existingUser = await User.findOne({ username: username });
  } catch (err) {
    const error = new ExpressError(
      "Signing up failed, please try again later.",
      500
    );
    return next(error);
  }

  if (existingUser) {
    const error = new ExpressError(
      "User exists already, please login instead.",
      422
    );
    return next(error);
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new ExpressError(
      "Could not create user, please try again.",
      500
    );
    return next(error);
  }

  const user = new User({
    email,
    username,
    password: hashedPassword,
  });

  try {
    await user.save();
  } catch (err) {
    const error = new ExpressError(
      "Signing up failed, please try again later.",
      500
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "10h" }
    );
  } catch (err) {
    const error = new ExpressError(
      "Signing up failed, please try again later.",
      500
    );
    return next(error);
  }
  res
    .status(201)
    .json({ userId: user._id, username: user.username, token: token });
};

//login

module.exports.login = async (req, res, next) => {
  const { username, password } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ username: username });
  } catch (err) {
    const error = new ExpressError(
      "Logging in failed, please try again later.",
      500
    );
    return next(error);
  }

  if (!existingUser) {
    const error = new ExpressError(
      "Invalid credentials, could not log you in.",
      403
    );
    return next(error);
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    const error = new ExpressError(
      "Could not log you in, please check your credentials and try again.",
      500
    );
    return next(error);
  }

  if (!isValidPassword) {
    const error = new ExpressError(
      "Invalid credentials, could not log you in.",
      403
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: existingUser._id, username: existingUser.username },
      process.env.JWT_SECRET,
      { expiresIn: "10h" }
    );
  } catch (err) {
    const error = new ExpressError(
      "Logging in failed, please try again later.",
      500
    );
    return next(error);
  }

  res.json({
    userId: existingUser._id,
    username: existingUser.username,
    token: token,
  });
};

module.exports.getLatestItemsByUserId = async (req, res, next) => {
  const userId = req.params.userId;

  let user;
  try {
    user = await User.findById(userId)
      .populate("journeys")
      .populate({
        path: "posts",
        populate: {
          path: "journey",
          select: ["title", "_id"],
        },
      })
      .populate({
        path: "exps",
        populate: {
          path: "journey",
          select: ["title", "_id"],
        },
      });
  } catch (err) {
    const error = new ExpressError(
      "Fetching data failed, please try again later.",
      500
    );
    return next(error);
  }

  if (!user) {
    return next(new ExpressError("Could not find user.", 404));
  }

  let items;
  try {
    const posts = user.posts ?? [];
    const journeys = user.journeys ?? [];
    const exps = user.exps ?? [];

    // const periodDays = req.query.period || 10;
    // const limit = Date.now() - 1000 * 60 * 60 * 24 * periodDays;

    items = await [...posts, ...journeys, ...exps]
      .sort((a, b) => b.posted - a.posted)
      .slice(0, 20);
    // .filter((item) => {
    //   if (!item.posted) return false;
    //   return item.posted >= limit;
    // });
  } catch (err) {
    const error = new ExpressError("Fetching data failed.", 500);
    return next(error);
  }
  res.json({ items });
};

module.exports.getLatestFavsByUserId = async (req, res, next) => {
  const userId = req.params.userId;
  // const periodDays = req.query.period || 10;

  let user;
  try {
    user = await User.findById(userId)
      .populate({
        path: "favPosts",
        populate: {
          path: "item",
          populate: {
            path: "journey",
            select: ["title", "_id"],
          },
        },
      })
      .populate({
        path: "favUsers",
        populate: {
          path: "item",
          select: ["username", "itemType"],
        },
      })
      .populate({
        path: "favJourneys",
        populate: {
          path: "item",
        },
      })
      .populate({
        path: "favExps",
        populate: {
          path: "item",
          populate: {
            path: "journey",
            select: ["title", "_id"],
          },
        },
      });
  } catch (err) {
    const error = new ExpressError(
      "Fetching data failed, please try again later.",
      500
    );
    return next(error);
  }

  if (!user) {
    return next(new ExpressError("Could not find user.", 404));
  }

  let items;
  try {
    const posts = convertDeletedFavs(user, "favPosts", "post");
    const journeys = convertDeletedFavs(user, "favJourneys", "journey");
    const exps = convertDeletedFavs(user, "favExps", "exp");
    const users = convertDeletedFavs(user, "favUsers", "user");

    // const limit = Date.now() - 1000 * 60 * 60 * 24 * periodDays;
    items = await [...posts, ...journeys, ...exps, ...users]
      .sort((a, b) => b.posted - a.posted)
      .slice(0, 20);
    // .filter((item) => {
    //   if (!item.added) return false;
    //   return item.added >= limit;
    // });
  } catch (err) {
    const error = new ExpressError("Fetching data failed.", 500);
    return next(error);
  }
  res.json({ items });
};

module.exports.getItemsByUserId = async (req, res, next) => {
  const userId = req.params.userId;
  const itemType = req.query.type;
  const isRequestingFavs = !!req.query.fav;

  let arrayName;
  if (isRequestingFavs) {
    arrayName = "fav" + itemType[0].toUpperCase() + itemType.slice(1) + "s";
  } else {
    arrayName = itemType + "s";
  }

  let user;
  try {
    if (!isRequestingFavs) {
      if (itemType === ItemTypes.POSTS || itemType === ItemTypes.EXPS) {
        user = await User.findById(userId)
          .populate({
            path: arrayName,
            populate: {
              path: "journey",
              select: ["title", "_id"],
            },
          })
          .select(arrayName);
      }
      if (itemType === ItemTypes.JOURNEYS) {
        user = await User.findById(userId)
          .populate(arrayName)
          .select(arrayName);
      }
    } else if (isRequestingFavs) {
      if (itemType === ItemTypes.POSTS || itemType === ItemTypes.EXPS) {
        user = await User.findById(userId)
          .populate({
            path: arrayName,
            populate: {
              path: "item",
              populate: {
                path: "journey",
                select: ["title", "_id"],
              },
            },
          })
          .select(arrayName);
      } else if (itemType === ItemTypes.JOURNEYS) {
        user = await User.findById(userId)
          .populate({
            path: arrayName,
            populate: {
              path: "item",
            },
          })
          .select(arrayName);
      } else if (itemType === ItemTypes.USERS) {
        user = await User.findById(userId)
          .populate({
            path: arrayName,
            populate: {
              path: "item",
              select: ["username", "itemType"],
            },
          })
          .select(arrayName);
      }
    }
  } catch (err) {
    const error = new ExpressError(
      "Fetching data failed, please try again later.",
      500
    );
    return next(error);
  }

  if (!user) {
    return next(new ExpressError("Could not find user.", 404));
  }

  let items;
  if (!isRequestingFavs) {
    items = user[arrayName] ?? [];
  } else {
    items = convertDeletedFavs(user, arrayName, itemType);
  }

  res.json({ items });
};

module.exports.getBlogData = async (req, res, next) => {
  const userId = req.params.userId;

  let user;
  try {
    user = await User.findById(userId).select([
      "username",
      "about",
      "blogTitle",
      "blogDesc",
      "image",
      "profileImage",
      "posts",
      "postNum",
      "exps",
      "expNum",
      "journeys",
      "journeyNum",
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

  const newUser = user.toJSON();
  delete newUser.posts;
  delete newUser.journeys;
  delete newUser.exps;

  res.json({ user: newUser });
};

module.exports.getProfileData = async (req, res, next) => {
  const userId = req.params.userId;
  const { userId: loggedInUserId } = req.userData;

  if (userId !== loggedInUserId) {
    const error = new ExpressError(
      "You are not authorized to access this page.",
      403
    );
    return next(error);
  }

  let user;
  try {
    user = await User.findById(userId).select([
      "username",
      "about",
      "email",
      "profileImage",
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

module.exports.deleteUserAccount = async (req, res, next) => {
  const userId = req.params.userId;
  const { userId: loggedInUserId } = req.userData;
  const { password } = req.body;

  if (userId !== loggedInUserId) {
    const error = new ExpressError("You are not authorized to do that.", 403);
    return next(error);
  }

  let user;
  try {
    user = await User.findById(userId);
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

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, user.password);
  } catch (err) {
    const error = new ExpressError(
      "Please check your credentials and try again.",
      500
    );
    return next(error);
  }

  if (!isValidPassword) {
    const error = new ExpressError("Invalid password.", 403);
    return next(error);
  }

  const { posts, journeys, exps } = user;

  await user.populate(["posts", "journeys", "exps"]);
  const images = [...user.posts, ...user.journeys, ...user.exps]
    .filter((item) => !!item.image?.filename)
    .map((item) => item.image.filename);

  await Post.deleteMany({ _id: { $in: posts } });
  await Journey.deleteMany({ _id: { $in: journeys } });
  await Exp.deleteMany({ _id: { $in: exps } });

  images.forEach(async (filename) => {
    await cloudinary.uploader.destroy(filename);
  });

  if (user.image && user.image.filename) {
    await cloudinary.uploader.destroy(user.image.filename);
  }

  if (user.profileImage && user.profileImage.filename) {
    await cloudinary.uploader.destroy(user.profileImage.filename);
  }

  await User.findByIdAndDelete(userId);

  res.json({ msg: "Successfully deleted account." });
};
