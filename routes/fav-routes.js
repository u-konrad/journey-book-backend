const express = require("express");
const { isLoggedIn } = require("../middleware/middleware");
const {
  getUserFavs,
  addItemToFavs,
  removeItemFromFavs,
  clearDeletedFav,
} = require("../controllers/fav-controllers");
const catchAsync = require("../utils/catchAsync");

const router = express.Router();

router
  .route("/")
  .get(isLoggedIn, catchAsync(getUserFavs))
  .post(isLoggedIn, catchAsync(addItemToFavs))
  .delete(isLoggedIn, catchAsync(removeItemFromFavs));

router.route("/clear").delete(isLoggedIn, catchAsync(clearDeletedFav));

module.exports = router;
