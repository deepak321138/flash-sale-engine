exports.errorHandler = (err, req, res, next) => {
  const isProd = process.env.NODE_ENV === 'production';
  let status = 500;
  let message = 'Internal Server Error';

  if (err.name === 'ValidationError' || err.status === 400) {
    status = 400;
    message = err.message || 'Bad Request';
  } else if (err.code === 11000 || err.status === 409) {
    status = 409;
    message = 'Conflict';
  } else if (err.status && err.status >= 400 && err.status < 500) {
    status = err.status;
    message = err.message;
  }

  if (!isProd && err.stack) {
    return res.status(status).json({ error: message, stack: err.stack });
  }
  res.status(status).json({ error: message });
};
