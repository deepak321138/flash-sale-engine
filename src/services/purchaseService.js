const mongoose = require('mongoose');
const Product = require('../models/product');
const Order = require('../models/order');

exports.createOrder = async (postData) => {

  // 1️⃣ Idempotency check first
  const existingOrder = await Order.findOne({
    idempotencyKey: postData.idempotencyKey
  });

  if (existingOrder) {
    return { existingOrder };
  }

  // 2️⃣ Atomic stock decrement
  const product = await Product.findOneAndUpdate(
    {
      _id: postData.productId,
      stock: { $gte: postData.quantity }
    },
    {
      $inc: { stock: -postData.quantity }
    },
    { new: true }
  );

  if (!product) {
    return { outOfStock: true };
  }

  // 3️⃣ Create order
  try {
    const order = await Order.create({
      productId: postData.productId,
      quantity: postData.quantity,
      total: product.price * postData.quantity,
      idempotencyKey: postData.idempotencyKey
    });

    return { order };

  } catch (err) {

    // If duplicate idempotency key occurs due to race
    if (err.code === 11000) {
      const existing = await Order.findOne({
        idempotencyKey: postData.idempotencyKey
      });
      return { existingOrder: existing };
    }

    throw err;
  }
};