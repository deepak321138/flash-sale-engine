const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/index');
const Product = require('../src/models/product');
const Order = require('../src/models/order');
const { v4: uuidv4 } = require('uuid');

describe('Atomic Order Engine - Concurrency Test', () => {
  let productId;

  beforeAll(async () => {
    // Connect to test DB
    await mongoose.connect(process.env.MONGO_URI, { dbName: 'flash-sale' });
    // Clear collections
    await Product.deleteMany({});
    await Order.deleteMany({});
    // Add a product with limited stock
    const product = await Product.create({
      sku: 'TESTSKU',
      name: 'Test Product',
      category: 'Test',
      price: 100,
      stock: 5,
      saleStartAt: new Date()
    });
    productId = product._id.toString();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('should allow only as many orders as stock and prevent over-selling', async () => {
    const totalRequests = 20; // Simulate 20 concurrent requests for 5 stock
    const responses = await Promise.all(
      Array.from({ length: totalRequests }).map(() =>
        request(app)
          .post('/api/purchase/order')
          .send({
            productId,
            quantity: 1,
            idempotencyKey: uuidv4()
          })
      )
    );

    // Count successful orders
    const successCount = responses.filter(r => r.status === 201).length;
    const conflictCount = responses.filter(r => r.status === 409).length;

    // Check only 5 orders succeeded, rest failed gracefully
    expect(successCount).toBe(5);
    expect(conflictCount).toBe(totalRequests - 5);

    // Check stock is now 0
    const product = await Product.findById(productId);
    expect(product.stock).toBe(0);

    // Check 5 orders in DB
    const orderCount = await Order.countDocuments({ productId });
    expect(orderCount).toBe(5);
  });
});