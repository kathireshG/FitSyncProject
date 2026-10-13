const path = require("path");

const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";

const jwtSecret = process.env.JWT_SECRET || "local-development-secret-change-me";

if (isProduction && jwtSecret === "local-development-secret-change-me") {
  throw new Error("JWT_SECRET must be configured in production");
}

module.exports = {
  nodeEnv,
  isProduction,
  host: process.env.HOST || "127.0.0.1",
  port: Number(process.env.PORT || 4000),
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/fitness",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  appUrl: process.env.APP_URL || "http://localhost:5173",
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  resetTokenTtlMinutes: Number(process.env.RESET_TOKEN_TTL_MINUTES || 30),
  uploadDirectory: path.resolve(
    process.env.UPLOAD_DIR || path.join(__dirname, "../../uploads/avatars")
  ),
};
