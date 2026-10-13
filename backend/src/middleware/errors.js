const AppError = require("../utils/AppError");

function notFound(req, _res, next) {
  next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

function errorHandler(error, _req, res, _next) {
  let statusCode = error.statusCode || 500;
  let message = error.message || "Internal server error";
  let details = error.details;

  if (error.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${error.path}`;
  }

  if (error.code === 11000) {
    statusCode = 409;
    message = "A record with that value already exists";
    details = error.keyValue;
  }

  if (error.name === "ValidationError") {
    statusCode = 400;
    message = "Validation failed";
    details = Object.values(error.errors).map((item) => ({
      field: item.path,
      message: item.message,
    }));
  }

  if (error.code === "LIMIT_FILE_SIZE") {
    statusCode = 400;
    message = "Avatar must be 5 MB or smaller";
  }

  const response = { error: { message } };
  if (details) response.error.details = details;
  if (process.env.NODE_ENV !== "production" && statusCode === 500) {
    response.error.stack = error.stack;
  }

  res.status(statusCode).json(response);
}

module.exports = { notFound, errorHandler };
