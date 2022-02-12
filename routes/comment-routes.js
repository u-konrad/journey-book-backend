const express = require("express");
const { isLoggedIn } = require("../middleware/middleware");
const catchAsync = require("../utils/catchAsync");

const multer = require("multer");
const { storage } = require("../cloudinary");
const upload = multer({ storage });

const {
  getCommentsById,
  addNewComment,
} = require("../controllers/comment-controllers");

const router = express.Router();

router.route("/:itemId").get(catchAsync(getCommentsById)).post(
  isLoggedIn,
  upload.single("image"),
  catchAsync(addNewComment)
);

module.exports = router;
