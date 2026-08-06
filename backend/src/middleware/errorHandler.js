function notFoundHandler(req, res, next) {
  res.status(404).json({ error: "Not Found", path: req.originalUrl });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error("[ERROR]", err.message);
  if (process.env.NODE_ENV !== "production") {
    console.error(err.stack);
  }

  const status = err.status || 500;
  res.status(status).json({
    error: status === 500 ? "Internal Server Error" : err.message,
    ...(process.env.NODE_ENV !== "production" && { details: err.message }),
  });
}

module.exports = { notFoundHandler, errorHandler };
