const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const morgan = require('morgan');
const ExpressError = require('./utils/ExpressError');
const catchAsync = require('./utils/catchAsync');
const ejsMate = require('ejs-mate');

const Product = require('./models/product');
const Farm = require('./models/farm');
const { accessSync } = require('fs');
const categories = ['fruit', 'vegetable', 'dairy'];

const app = express();

main()
    .then(() => { console.log('MONGOOSE CONECT!!') })
    .catch(err => console.log(err));

async function main() {
    await mongoose.connect('mongodb://localhost:27017/farmStandTake');
}

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.engine('ejs', ejsMate);
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'))
app.use(morgan('dev'))



app.get('/farms', catchAsync(async (req, res, next) => {
    const farms = await Farm.find({});
    if (!farms) {
        throw new ExpressError('NOT FOUND A FARMS!');
    }
    res.render('farms/index', { farms })
}))

app.get('/farms/new', (req, res) => {
    res.render('farms/new')
})

app.get('/farms/:id', catchAsync(async (req, res, next) => {
    const farm = await Farm.findById(req.params.id).populate('products');
    console.log(farm);
    res.render('farms/show', { farm })
}))

app.delete('/farms/:id', async (req, res) => {
    const farm = await Farm.findByIdAndDelete(req.params.id);
    console.log(farm);
    res.redirect('/farms');
})




app.post('/farms', async (req, res) => {
    const farm = new Farm(req.body);
    await farm.save();
    res.redirect('/farms')
})

app.get('/farms/:id/products/new', async (req, res) => {
    const { id } = req.params;
    const farm = await Farm.findById(id);
    res.render('products/new', { categories, farm })
})

app.post('/farms/:id/products', async (req, res) => {
    const { id } = req.params;
    const farm = await Farm.findById(id);
    const { name, price, category } = req.body;
    const product = new Product({ name, price, category });
    farm.products.push(product);
    product.farm = farm;
    await farm.save();
    await product.save();
    res.redirect(`/farms/${id}`)
})



// PRODUCT ROUTES

app.get('/products', async (req, res) => {
    const { category } = req.query;
    if (category) {
        const products = await Product.find({ category })
        res.render('products/index', { products, category })
    } else {
        const products = await Product.find({})
        res.render('products/index', { products, category: 'All' })
    }
})

app.get('/products/new', (req, res) => {
    res.render('products/new', { categories })
})

app.post('/products', async (req, res) => {
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.redirect(`/products/${newProduct._id}`)
})

app.get('/products/:id', async (req, res) => {
    const { id } = req.params;
    const product = await Product.findById(id).populate('farm', 'name');
    res.render('products/show', { product })
})

app.get('/products/:id/edit', async (req, res) => {
    const { id } = req.params;
    const product = await Product.findById(id);
    res.render('products/edit', { product, categories })
})

app.put('/products/:id', async (req, res) => {
    const { id } = req.params;
    const product = await Product.findByIdAndUpdate(id, req.body, { runValidators: true, new: true });
    res.redirect(`/products/${product._id}`);
})

app.delete('/products/:id', async (req, res) => {
    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id);
    res.redirect('/products');
})

const errorHandler = (err) => {
    console.dir(err);
    return new ExpressError(`ERR - ${err.name}, MESSAGE - ${err.message}, STATUS - ${err.status}`);
}

app.all('*', (req, res, next) => {
    next(new ExpressError('PAGE NOT FOUND!!', 404));
})


app.use((err, req, res, next) => {
    console.log('*************************************')
    console.log('*************************************')
    console.log('----------------ERROR----------------')
    console.log('*************************************')
    console.log('*************************************')
    console.log(err.name)
    if (err.name === "Error" || err.name === 'CastError' || err.name === 'ValidationError') {
        err = errorHandler(err)
    }
    const { status = 500, message = 'SOMETHING WORNG!!' } = err;
    res.status(status).render('error', {
        status, message, err
    });
})


app.listen(3000, () => {
    console.log('APP IS LISTENING ON PORT 3000!!');
})