const User = require("../models/User");
const ProgressEntry = require("../models/ProgressEntry");
const AppError = require("../utils/AppError");
const {
  validateEmail,
  validatePassword,
  numberOrUndefined,
  parseDate,
  requireFields,
  normalizeDay,
  calculateBmi,
} = require("../utils/validation");
const { getPagination, createPagination } = require("../utils/pagination");

function getMe(req, res) {
  res.json({ user: req.user });
}

async function updateMe(req, res) {
  const updates = {};
  if (req.body.name !== undefined) updates.name = String(req.body.name).trim();
  if (req.body.email !== undefined) {
    validateEmail(req.body.email);
    updates.email = req.body.email.trim().toLowerCase();
  }
  if (req.body.height !== undefined) {
    updates.height = numberOrUndefined(req.body.height, "height", { min: 50, max: 300 });
  }
  if (req.body.weight !== undefined) {
    updates.weight = numberOrUndefined(req.body.weight, "weight", { min: 20, max: 500 });
  }
  if (req.body.goalWeight !== undefined) {
    updates.goalWeight = numberOrUndefined(req.body.goalWeight, "goalWeight", { min: 20, max: 500 });
  }
  if (req.body.dob !== undefined) updates.dob = parseDate(req.body.dob, "dob");

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true,
  });

  if ((updates.weight !== undefined || updates.height !== undefined) && user.weight) {
    const progress = { weightKg: user.weight };
    if (user.height) {
      progress.heightCm = user.height;
      progress.bmi = calculateBmi(user.weight, user.height);
    }
    await ProgressEntry.findOneAndUpdate(
      { owner: user.id, date: normalizeDay(new Date()) },
      { $set: progress, $setOnInsert: { owner: user.id, date: normalizeDay(new Date()) } },
      { new: true, upsert: true, runValidators: true }
    );
  }
  res.json({ user });
}

async function changePassword(req, res) {
  requireFields(req.body, ["currentPassword", "newPassword"]);
  validatePassword(req.body.newPassword);

  const user = await User.findById(req.user.id).select("+password");
  if (!(await user.comparePassword(req.body.currentPassword))) {
    throw new AppError(400, "Current password is incorrect");
  }

  user.password = req.body.newPassword;
  await user.save();
  res.json({ message: "Password updated successfully" });
}

async function listUsers(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const [users, total] = await Promise.all([
    User.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(),
  ]);
  res.json({ data: users, pagination: createPagination({ page, limit, total }) });
}

module.exports = { getMe, updateMe, changePassword, listUsers };
