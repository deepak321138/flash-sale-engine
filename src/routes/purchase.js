const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');
const { validatePurchase } = require('../middlewares/validation');


router.post('/order',validatePurchase, purchaseController.createOrder);

module.exports = router;