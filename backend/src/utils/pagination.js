const AppError = require("./AppError");

function parsePositiveInteger(value, field, fallback) {
  if (value === undefined) return fallback;
  if (!/^\d+$/.test(String(value)) || Number(value) < 1) {
    throw new AppError(400, `${field} must be a positive integer`);
  }
  return Number(value);
}

function getPagination(query, { defaultLimit = 20, maxLimit = 100 } = {}) {
  const page = parsePositiveInteger(query.page, "page", 1);
  const requestedLimit = parsePositiveInteger(query.limit, "limit", defaultLimit);
  const limit = Math.min(requestedLimit, maxLimit);
  return { page, limit, skip: (page - 1) * limit };
}

function createPagination({ page, limit, total }) {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasPreviousPage: page > 1,
    hasNextPage: page < totalPages,
  };
}

module.exports = { getPagination, createPagination };
