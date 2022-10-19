const Joi = require('joi');

module.exports = FarmsAndProductsSchema = Joi.object({
    name: Joi.string().required(),
    city: Joi.string().required().min(0),
    email: Joi.string().required(),
    products: Joi.object({
        name: Joi.string(),
        price: Joi.string(),
        category: Joi.array(),
    }).required()
}).required()

