const Product = require('../models/product');

// 🔹 Single Product
exports.addProduct = async (productData) => {
  const product = new Product(productData);
  return await product.save();
};

// 🔹 Bulk Products
exports.addManyProducts = async (productsArray) => {
  return await Product.insertMany(productsArray, { ordered: false });
};