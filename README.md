# Flash Sale Engine

## Overview

This project implements a resilient flash sale engine designed to handle massive concurrent purchase requests for high-demand products, while providing real-time analytics for administrators.

---

## Features

### 1. Atomic Order Engine

- **Concurrency Barrier:**  
  Prevents over-selling by using an atomic `findOneAndUpdate` with a stock check inside a MongoDB transaction. If 500 requests hit a product with 5 in stock, only 5 succeed, 495 fail gracefully.
- **Idempotency:**  
  Each purchase request must include an `idempotencyKey`. Duplicate requests with the same key will not create duplicate orders or decrement stock more than once.
- **Integrity:**  
  Order creation and stock decrement are performed as a single atomic transaction, ensuring data consistency.

### 2. Performance-First Analytics

- **Single Aggregation Pipeline:**  
  The dashboard endpoint (`/api/dashboard/stats`) uses a single MongoDB aggregation pipeline with `$facet` to compute all required metrics:
    - **Revenue & Volume:** Total sales value and total items sold.
    - **Stock Health:** Lists of products with "Critical Stock" (<10) and "Healthy Stock".
    - **Top Performers:** Top 3 categories by total revenue.
    - **Conversion Speed:** Average time from product added to first successful order.

### 3. Middleware

- **Validation:**  
  All input is validated using `express-validator` middleware before reaching controllers.
- **Error Handling:**  
  Centralized error handler distinguishes between client errors (4xx), conflict errors (409), and server errors (5xx). No sensitive stack traces are leaked in production.
- **Logging:**  
  Each request logs a request-id, HTTP method, and duration.

---

## Technical Stack

- Node.js
- Express
- MongoDB (Mongoose)
- express-validator

---

## Project Structure

```
src/
  controllers/
  middlewares/
  models/
  routes/
  services/
  validations/
```

---

## Concurrency Pattern Explanation

**Why this pattern?**  
We use MongoDB's atomic `findOneAndUpdate` with a stock check and transactions to ensure that only available stock can be sold, even under high concurrency.  
- This prevents race conditions and over-selling.
- The idempotencyKey ensures that duplicate requests (due to retries or network issues) do not result in duplicate orders or double stock decrement.

---

## Indexing Strategy for Analytics

To keep the dashboard aggregation query performant (under 200ms with 5 million orders), the following indexes are recommended:

- **Orders Collection:**
  - `{ productId: 1 }` — for fast lookups and joins with products.
  - `{ createdAt: 1 }` — for conversion speed and time-based queries.
  - `{ total: 1 }` — for revenue calculations.
- **Products Collection:**
  - `{ category: 1 }` — for grouping by category.
  - `{ stock: 1 }` — for stock health queries.
  - `{ createdAt: 1 }` — for conversion speed.

All aggregation `$lookup` and `$group` operations are covered by these indexes, ensuring the pipeline remains efficient even at scale.

---

## Testing

- Integration tests (using Jest and Supertest) simulate multiple concurrent purchase requests to ensure that over-selling does not occur and idempotency is enforced.

Concurrency Test
This project includes an integration test to verify that the Atomic Order Engine prevents over-selling under high concurrency.

How to Run the Concurrency Test
Make sure your MongoDB connection string in tests/concurrency.test.js is correct.
Run all tests:
npm test
Or run only the concurrency test:
npx jest tests/concurrency.test.js --runInBand
What This Test Does
Adds a product with stock = 5.
Fires 20 concurrent purchase requests for that product.
Asserts that only 5 orders succeed (201), and the rest fail gracefully (409).
Verifies that the product stock is decremented to 0 and only 5 orders exist in the database.
Expected Output:

No over-selling: Only as many orders as available stock will succeed.
Graceful failure: All other requests receive a conflict error (409).
Data integrity: Product stock and order count are correct after the test.
Add this to your README for clear instructions on running and understanding the concurrency test!

---

## API Endpoints

### Product

- `POST /api/product/add` — Add one or multiple products.

### Purchase

- `POST /api/purchase/order` — Place an order for a product (requires `productId`, `quantity`, `idempotencyKey`).

### Dashboard

- `GET /api/dashboard/stats` — Get real-time analytics.

---

## How to Run

1. Install dependencies:  
   `npm install`
2. Start the server:  
   `npm run dev`
3. Use Postman or similar tool to interact with the API.

---

## Notes

- Always send a unique `idempotencyKey` from the frontend for each purchase attempt.
- For best performance, ensure MongoDB is running in a production environment with proper indexing.

---
