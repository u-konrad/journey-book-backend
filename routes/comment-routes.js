const express = require("express");
const { isLoggedIn } = require("../middleware/middleware");
const catchAsync = require("../utils/catchAsync");

const{getCommentsById,addNewComment} = require('../controllers/comment-controllers')

const router = express.Router();

router
  .route("/:itemId")
  .get(catchAsync(getCommentsById))
  .post(isLoggedIn, catchAsync(addNewComment));

  module.exports=router;
