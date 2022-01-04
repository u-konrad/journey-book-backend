const BaseJoi = require('joi');
const sanitizeHtml = require('sanitize-html');

const extension = (joi) => ({
    type: 'string',
    base: joi.string(),
    messages: {
        'string.escapeHTML': '{{#label}} must not include HTML!'
    },
    rules: {
        escapeHTML: {
            validate(value, helpers) {
                
                const clean = sanitizeHtml(value, {
                    allowedTags: [],
                    allowedAttributes: {},
                });
                if (clean !== value) return helpers.error('string.escapeHTML', { value })
                return clean;
            }
        }
    }
});

const Joi = BaseJoi.extend(extension)


module.exports.userSchema = Joi.object({
    username:Joi.string(),
    email:Joi.string().email(),
    password:Joi.string(),
    joined:Joi.date(),
    posts:Joi.array(),
    journeys:Joi.array(),
    exps:Joi.array(),
    favPosts:Joi.array(),
    favJourneys:Joi.array(),
    favExps:Joi.array(),
    favUsers:Joi.array(),
    blogTitle:Joi.string(),
    blogDesc:Joi.string(),
    image:Joi.any(),
    profileImage:Joi.any(),
    about:Joi.string()

})

module.exports.itemSchema =Joi.object({
    itemType:Joi.string(),
    title:Joi.string().required(),
    content:Joi.string().required(),
    posted:Joi.number(),
    edited:Joi.number(),
    authorName:Joi.string(),
    location:Joi.string().allow('').escapeHTML(),
    coordinates:Joi.string().allow(''),
    author:Joi.any(),
    image:Joi.any(),
    journey:Joi.any().allow(''),
    rating:Joi.number(),
    category:Joi.string().allow(''),
    posts:Joi.array(),
    exps:Joi.array(),
    when:Joi.string()
})