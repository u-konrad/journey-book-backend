const {
  deleteItem,
  updateItem,
  getItemById,
  getAllItems,
  addNewItem,
  getItemsByQuery,
} = require("../controllers/item-controllers");
const catchAsync = require("../utils/catchAsync");

const multer = require("multer");
const { storage } = require("../cloudinary");
const upload = multer({ storage });

const {
  isLoggedIn,
  isOwner,
  validateItem,
} = require("../middleware/middleware");

const express = require("express");
const router = express.Router();

//url/items
router.route("/").get(getAllItems);

router
  .route("/new")
  .post(
    isLoggedIn,
    upload.single("image"),
    validateItem,
    catchAsync(addNewItem)
  );

router.route("/search").get(catchAsync(getItemsByQuery));

router
  .route("/:itemId")
  .get(catchAsync(getItemById))
  .patch(
    isLoggedIn,
    isOwner,
    upload.single("image"),
    validateItem,
    catchAsync(updateItem)
  )
  .delete(isLoggedIn, catchAsync(deleteItem));

module.exports = router;
