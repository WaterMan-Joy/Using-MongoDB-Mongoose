const mongoose = require('mongoose');
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

const Farm = mongoose.model('Farm', farmSchema);
module.exports = Farm;
