const Joi = require('joi');

module.exports = farmsAndProductsSchema = Joi.object({
    name: Joi.string().required(),
    city: Joi.string().required(),
    email: Joi.string().required(),
    products: Joi.object({
        name: Joi.string(),
        price: Joi.number(),
        category: Joi.string(),
    })
})

