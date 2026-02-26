const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');

exports.validateAddProduct = [

  body().custom((value, { req }) => {

    const validateSingle = (product, idx = null) => {

      const prefix = idx !== null ? `products[${idx}].` : '';

      if (!product.sku || !product.sku.trim())
        throw new Error(`${prefix}sku is required`);

      if (!product.name || !product.name.trim())
        throw new Error(`${prefix}name is required`);

      if (!product.category || !product.category.trim())
        throw new Error(`${prefix}category is required`);

      if (product.price === undefined || typeof product.price !== 'number' || product.price < 0)
        throw new Error(`${prefix}price must be a positive number`);

      if (product.stock === undefined || typeof product.stock !== 'number' || product.stock < 0)
        throw new Error(`${prefix}stock must be a positive number`);

      if (!product.saleStartAt || isNaN(Date.parse(product.saleStartAt)))
        throw new Error(`${prefix}saleStartAt must be a valid date`);

      // Trim fields before saving
      product.sku = product.sku.trim();
      product.name = product.name.trim();
      product.category = product.category.trim();
    };


    //  BULK
    if (Array.isArray(req.body)) {

      if (req.body.length === 0)
        throw new Error('products array cannot be empty');

      req.body.forEach((product, idx) => validateSingle(product, idx));

    } else {

      validateSingle(req.body);
    }

    return true;
  }),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "fail",
        message: errors.array()[0].msg
      });
    }
    next();
  }

];

exports.validatePurchase = [

  body().custom((value, { req }) => {

    const { productId, quantity, idempotencyKey } = req.body;

    // productId required + valid ObjectId
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      throw new Error('productId must be a valid Mongo ObjectId');
    }

    // quantity required + positive integer
    if (
      quantity === undefined ||
      typeof quantity !== 'number' ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      throw new Error('quantity must be a positive integer');
    }

    // idempotencyKey required + non-empty string
    if (
      !idempotencyKey ||
      typeof idempotencyKey !== 'string' ||
      !idempotencyKey.trim()
    ) {
      throw new Error('idempotencyKey is required');
    }

    // Trim idempotencyKey
    req.body.idempotencyKey = idempotencyKey.trim();

    return true;
  }),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "fail",
        message: errors.array()[0].msg
      });
    }
    next();
  }

];