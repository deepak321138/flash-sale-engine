const purchaseService = require('../services/purchaseService');

exports.createOrder = async (req, res, next) => {
  try {
    const { productId, quantity, idempotencyKey } = req.body;
    let postData = {
      productId,
      quantity,
      idempotencyKey
    };
    const result = await purchaseService.createOrder(postData);
    if (result.existingOrder) {
      return res.status(200).json({ order: result.existingOrder, message: 'Order already processed' });
    }
    if (result.outOfStock) {
      return res.status(409).json({ error: 'Out of stock or insufficient stock' });
    }
    res.status(201).json({ order: result.order });
  } catch (err) {
    next(err);
  }
};