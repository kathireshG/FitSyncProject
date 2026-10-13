const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ProgressEntry = require("../models/ProgressEntry");
const env = require("../config/env");
const AppError = require("../utils/AppError");
const {
  requireFields,
  validateEmail,
  validatePassword,
  numberOrUndefined,
  parseDate,
  normalizeDay,
  calculateBmi,
} = require("../utils/validation");
const { sendPasswordResetEmail } = require("../services/email");

function createToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

async function register(req, res) {
  requireFields(req.body, ["name", "email", "password"]);
  validateEmail(req.body.email);
  validatePassword(req.body.password);

  const email = req.body.email.trim().toLowerCase();
  if (await User.exists({ email })) {
    throw new AppError(409, "An account with this email already exists");
  }

  const height = numberOrUndefined(req.body.height, "height", { min: 50, max: 300 });
  const weight = numberOrUndefined(req.body.weight, "weight", { min: 20, max: 500 });
  const user = await User.create({
    name: String(req.body.name).trim(),
    email,
    password: req.body.password,
    height,
    weight,
    dob: req.body.dob ? parseDate(req.body.dob, "dob") : undefined,
  });

  if (weight) {
    const bmi = calculateBmi(weight, height);
    await ProgressEntry.create({
      owner: user._id,
      date: normalizeDay(new Date()),
      weightKg: weight,
      heightCm: height,
      bmi,
    });
  }

  res.status(201).json({ user, token: createToken(user) });
}

async function login(req, res) {
  requireFields(req.body, ["email", "password"]);
  validateEmail(req.body.email);

  const user = await User.findOne({
    email: req.body.email.trim().toLowerCase(),
  }).select("+password");

  if (!user || !(await user.comparePassword(req.body.password))) {
    throw new AppError(401, "Invalid email or password");
  }

  res.json({ user, token: createToken(user) });
}

async function forgotPassword(req, res) {
  requireFields(req.body, ["email"]);
  validateEmail(req.body.email);

  const genericResponse = {
    message: "If that email is registered, a reset link has been sent.",
  };
  const user = await User.findOne({ email: req.body.email.trim().toLowerCase() });
  if (!user) return res.json(genericResponse);

  const token = crypto.randomBytes(32).toString("hex");
  user.passwordResetToken = crypto.createHash("sha256").update(token).digest("hex");
  user.passwordResetExpires = new Date(
    Date.now() + env.resetTokenTtlMinutes * 60 * 1000
  );
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${env.appUrl}/reset-password/${token}`;
  let emailSent = false;
  try {
    emailSent = await sendPasswordResetEmail({ to: user.email, resetUrl });
  } catch (error) {
    console.error("Unable to send password reset email:", error.message);
  }

  if (!env.isProduction) {
    genericResponse.development = { resetToken: token, resetUrl, emailSent };
  }
  return res.json(genericResponse);
}

async function resetPassword(req, res) {
  requireFields(req.body, ["password"]);
  validatePassword(req.body.password);

  const tokenHash = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: tokenHash,
    passwordResetExpires: { $gt: new Date() },
  }).select("+password +passwordResetToken +passwordResetExpires");

  if (!user) {
    throw new AppError(400, "Password reset token is invalid or has expired");
  }

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.json({
    message: "Password reset successfully",
    user,
    token: createToken(user),
  });
}

module.exports = { register, login, forgotPassword, resetPassword };
