const { string, number } = require('joi');
const Joi = require('joi');

module.exports.farmsAndProductsSchema = Joi.object({
    name: Joi.string().required(),
    city: Joi.string().required(),
    email: Joi.string().required(),
    // FIXME:
    // products: Joi.object({
    //     name: string(),
    //     price: number(),
    //     category: string(),
    // })
}).required()

// module.exports.