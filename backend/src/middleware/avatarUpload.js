const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const env = require("../config/env");
const AppError = require("../utils/AppError");

fs.mkdirSync(env.uploadDirectory, { recursive: true });

const extensions = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const storage = multer.diskStorage({
  destination: env.uploadDirectory,
  filename(_req, file, callback) {
    callback(null, `${crypto.randomUUID()}${extensions[file.mimetype]}`);
  },
});

module.exports = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(_req, file, callback) {
    if (!extensions[file.mimetype]) {
      return callback(new AppError(400, "Avatar must be a JPG, PNG, or WebP image"));
    }
    return callback(null, true);
  },
});
