const express = require('express');
const router = express.Router();

router.use('/purchase', require('./purchase'));
router.use('/product', require('./product'));
router.use('/dashboard', require('./dashboard'));

module.exports = router;