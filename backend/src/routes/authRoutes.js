const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const asyncHandler = require("../utils/asyncHandler");
const controller = require("../controllers/authController");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: { message: "Too many authentication attempts. Try again later." } },
});

router.use(authLimiter);
router.post("/register", asyncHandler(controller.register));
router.post("/login", asyncHandler(controller.login));
router.post("/forgot-password", asyncHandler(controller.forgotPassword));
router.post("/reset-password/:token", asyncHandler(controller.resetPassword));

module.exports = router;
