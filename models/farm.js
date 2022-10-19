const mongoose = require('mongoose');
const Product = require('./product');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;


const farmSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Farm must have a name!'],
    },
    city: {
        type: String,
    },
    email: {
        type: String,
        required: [true, 'Email requred!']
    },
    products: [
        {
            type: ObjectId,
            ref: 'Product'
        }
    ]
})


farmSchema.post('findOneAndDelete', async function (farm) {
    if (farm.products.length) {
        const deleteProduct = await Product.deleteMany({ _id: { $in: farm.products } });
        console.log(deleteProduct);
    }
})
const Farm = mongoose.model('Farm', farmSchema);
module.exports = Farm;
