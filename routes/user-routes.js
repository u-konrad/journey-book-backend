const express = require("express");
const {
  validateUser,
  isLoggedIn,
  isUser,
} = require("../middleware/middleware");
const {
  login,
  register,
  getItemsByUserId,
  getBlogData,
  getProfileData,
  getLatestItemsByUserId,
  getLatestFavsByUserId,
  deleteUserAccount,
} = require("../controllers/user-controllers");
const { updateItem } = require("../controllers/item-controllers");
const catchAsync = require("../utils/catchAsync");
const multer = require("multer");
const { storage } = require("../cloudinary");
const upload = multer({ storage });

const router = express.Router();

router.route("/register").post(validateUser, catchAsync(register));

router.route("/login").post(catchAsync(login));

router
  .route("/:userId")
  .delete(isLoggedIn, catchAsync(deleteUserAccount));

  router
  .route("/:itemId")
  .patch(
    isLoggedIn,
    isUser,
    upload.single("image"),
    validateUser,
    catchAsync(updateItem)
  )

router.route("/:userId/data").get(catchAsync(getBlogData));

router.route("/:userId/profile").get(isLoggedIn, catchAsync(getProfileData));

router.route("/:userId/latest").get(catchAsync(getLatestItemsByUserId));

router
  .route("/:userId/latest/favorites")
  .get(catchAsync(getLatestFavsByUserId));

router.route("/:userId/items").get(getItemsByUserId);

module.exports = router;
