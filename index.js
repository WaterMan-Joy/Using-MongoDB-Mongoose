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
const { farmsAndProductsSchema } = require('./schemas');
const session = require('express-session');
const flash = require('connect-flash');

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

app.use(session({
    secret: 'mykey',
    resave: false,
    saveUninitialized: true,
}))
app.use(flash());


// TODO:
const validateFarmsAndProducts = (req, res, next) => {
    const { error } = farmsAndProductsSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    }
    else {
        next();
    }
}

app.get('/farms', catchAsync(async (req, res, next) => {
    const farms = await Farm.find({});
    if (!farms) {
        throw next(new ExpressError('NOT FOUND A FARMS!', 404));
    }
    res.render('farms/index', { farms })
}))

app.get('/farms/new', (req, res) => {
    res.render('farms/new')
})

app.get('/farms/:id', catchAsync(async (req, res, next) => {
    const farm = await Farm.findById(req.params.id).populate('products');
    if (!farm) {
        throw next(new ExpressError('NOT FOUND FARMS ID!!', 404))
    }
    console.log(farm);
    res.render('farms/show', { farm })
}))

app.delete('/farms/:id', catchAsync(async (req, res, next) => {
    const farm = await Farm.findByIdAndDelete(req.params.id);
    if (!farm) {
        throw next(new ExpressError('NOT FOUND DELETE FARMS ID!!', 404))
    }
    console.log(farm);
    res.redirect('/farms');
}))

app.post('/farms', validateFarmsAndProducts, catchAsync(async (req, res) => {
    const farm = new Farm(req.body);
    await farm.save();
    res.redirect('/farms')
}))

app.get('/farms/:id/products/new', async (req, res) => {
    const { id } = req.params;
    const farm = await Farm.findById(id);
    res.render('products/new', { categories, farm })
})

// FIXME:
app.post('/farms/:id/products', validateFarmsAndProducts, catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const farm = await Farm.findById(id);
    const { name, price, category } = req.body;
    const product = new Product({ name, price, category });
    farm.products.push(product);
    product.farm = farm;
    await farm.save();
    await product.save();
    res.redirect(`/farms/${id}`)
}))



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

app.post('/products', validateFarmsAndProducts, catchAsync(async (req, res, next) => {
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.redirect(`/products/${newProduct._id}`)
}))

app.get('/products/:id', catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const product = await Product.findById(id).populate('farm');
    if (!product) {
        throw next(new ExpressError('NOT FOUND PRODUCT ID!', 404))
    }
    res.render('products/show', { product })
}))

app.get('/products/:id/edit', catchAsync(async (req, res) => {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
        throw next(new ExpressError('NOT FOUND PRODUCT EDIT PAGE!', 404))
    }
    res.render('products/edit', { product, categories })
}))

// FIXME: not put data!
app.put('/products/:id', validateFarmsAndProducts, catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const product = await Product.findByIdAndUpdate(id, req.body, { runValidators: true, new: true });
    console.log(product)
    res.redirect(`/products/${product._id}`);
}))

app.delete('/products/:id', async (req, res) => {
    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id);
    res.redirect('/products');
})

const errorHandler = (err) => {
    console.dir(err);
    return new ExpressError(`ERR - ${err.name}, MESSAGE - ${err.message}, STATUS - ${err.status}`, 400);
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
    if (err.name === "Error" || err.name === 'CastError' || err.name === 'validationError') {
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