export function notFoundHandler(req, res) {
  res.status(404).json({
    message: "Route not found",
    path: req.originalUrl,
  });
}

export function errorHandler(err, req, res, _next) {
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(err.statusCode || 500).json({
    message: err.message || "Internal server error",
  });
}

