const Journey = require("../models/journey");
const Post = require("../models/post");
const Exp = require("../models/exp");
const Comment =require("../models/comment")

module.exports.getCommentsById =async(req,res,next)=>{

    const { itemId } = req.params;
    const itemType = req.query.type;


}