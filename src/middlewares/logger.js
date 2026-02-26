const { v4: uuidv4 } = require('uuid');

exports.requestLogger = (req, res, next) => {
  const requestId = uuidv4();
  req.requestId = requestId;
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${requestId}] ${req.method} ${req.originalUrl} - ${duration}ms`);
  });
  next();
};
