const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { validateAddProduct } = require('../middlewares/validation');

router.post('/add', validateAddProduct, productController.addProduct);

module.exports = router;