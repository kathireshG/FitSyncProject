const AppError = require("./AppError");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function requireFields(body, fields) {
  const missing = fields.filter(
    (field) => body[field] === undefined || body[field] === null || body[field] === ""
  );
  if (missing.length) {
    throw new AppError(400, "Validation failed", {
      missing: missing.map((field) => ({ field, message: "Required" })),
    });
  }
}

function validateEmail(email) {
  if (!emailPattern.test(String(email || "").trim())) {
    throw new AppError(400, "A valid email address is required");
  }
}

function validatePassword(password) {
  if (typeof password !== "string" || password.length < 8) {
    throw new AppError(400, "Password must contain at least 8 characters");
  }
}

function numberOrUndefined(value, field, options = {}) {
  if (value === undefined || value === null || value === "") return undefined;
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new AppError(400, `${field} must be a number`);
  }
  if (options.min !== undefined && number < options.min) {
    throw new AppError(400, `${field} must be at least ${options.min}`);
  }
  if (options.max !== undefined && number > options.max) {
    throw new AppError(400, `${field} must be at most ${options.max}`);
  }
  return number;
}

function parseDate(value, field = "date") {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) {
    throw new AppError(400, `${field} must be a valid date`);
  }
  return date;
}

function normalizeDay(value) {
  const date = parseDate(value);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function calculateBmi(weightKg, heightCm) {
  if (!weightKg || !heightCm) return undefined;
  return Number((weightKg / (heightCm / 100) ** 2).toFixed(2));
}

module.exports = {
  requireFields,
  validateEmail,
  validatePassword,
  numberOrUndefined,
  parseDate,
  normalizeDay,
  calculateBmi,
};
