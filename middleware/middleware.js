const ExpressError = require("../utils/ExpressError");
const { userSchema, itemSchema } = require("../joi-schemas");
const jwt = require("jsonwebtoken");
const ItemTypes = require("../controllers/item-types");
const User = require("../models/user");

module.exports.validateUser = (req, res, next) => {
  const { error } = userSchema.validate(req.body);
  if (error) {
    const msg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(msg, 400);
  } else {
    next();
  }
};

module.exports.validateItem = (req, res, next) => {
  const { error } = itemSchema.validate(req.body);
  if (error) {
    const msg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(msg, 400);
  } else {
    next();
  }
};

module.exports.isLoggedIn = (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }
  try {
    const token = req.headers.authorization.split(" ")[1]; // Authorization: 'Bearer TOKEN'
    if (!token) {
      throw new Error("no token!", 403);
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    req.userData = { userId: decodedToken.userId };
    next();
  } catch (err) {
    const error = new ExpressError("Authentication failed!", 403);
    return next(error);
  }
};

module.exports.isOwner = async (req, res, next) => {
  const { userId } = req.userData;
  const itemType = req.query.type;
  const { itemId } = req.params;



  const user = await User.findById(userId);
  const arrayName = itemType + "s";

  if (user[arrayName].includes(itemId)) {
    return next();
  } else {
    const error = new ExpressError("Authentication failed!", 403);
    return next(error);
  }
};

module.exports.isUser = async (req, res, next) => {
  const { userId } = req.userData;
  const { itemId } = req.params;

    if (userId === itemId) {
      return next();
    } else {
      const error = new ExpressError("Authentication failed!", 403);
      return next(error);
    }
  
 
};
