const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 3000;
const MONGO_URI =
  process.env.MONGO_URI;

async function start() {
  await mongoose.connect(MONGO_URI, { dbName: 'flash-sale' });

  app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
  });
}

// 🚨 Important: Prevent server start in test mode
if (process.env.NODE_ENV !== 'test') {
  start().catch(err => {
    console.error('Failed to start', err);
    process.exit(1);
  });
}

module.exports = app;