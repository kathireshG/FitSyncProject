const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { requireFields, validateEmail } = require("../utils/validation");
const { sendContactEmail } = require("../services/email");

router.use(
  rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    requireFields(req.body, ["name", "email", "message"]);
    validateEmail(req.body.email);
    if (String(req.body.message).length > 5000) {
      throw new AppError(400, "Message must be 5000 characters or fewer");
    }
    const sent = await sendContactEmail(req.body);
    if (!sent) throw new AppError(503, "Email service is not configured");
    res.json({ message: "Message sent successfully" });
  })
);

module.exports = router;
