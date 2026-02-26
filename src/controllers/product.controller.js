const productService = require('../services/productService');

exports.addProduct = async (req, res, next) => {
  try {
    const payload = req.body;

    // 🔥 BULK INSERT
    if (Array.isArray(payload)) {

      const formattedProducts = payload.map(item => ({
        sku: item.sku,
        name: item.name,
        category: item.category,
        price: item.price,
        stock: item.stock,
        saleStartAt: item.saleStartAt
      }));

      const products = await productService.addManyProducts(formattedProducts);

      return res.status(201).json({
        message: "Products created successfully",
        count: products.length,
        products
      });
    }

    // 🔥 SINGLE INSERT
    const postData = {
      sku: payload?.sku,
      name: payload?.name,
      category: payload?.category,
      price: payload?.price,
      stock: payload?.stock,
      saleStartAt: payload?.saleStartAt
    };

    const product = await productService.addProduct(postData);

    return res.status(201).json({
      message: "Product created successfully",
      product
    });

  } catch (err) {
    next(err);
  }
};