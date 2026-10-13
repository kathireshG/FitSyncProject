const ProgressEntry = require("../models/ProgressEntry");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const { normalizeDay, numberOrUndefined, calculateBmi } = require("../utils/validation");
const { getPagination, createPagination } = require("../utils/pagination");

function buildProgress(body, user) {
  const values = {};
  if (body.weightKg !== undefined) {
    values.weightKg = numberOrUndefined(body.weightKg, "weightKg", { min: 20, max: 500 });
    const heightCm =
      body.heightCm !== undefined
        ? numberOrUndefined(body.heightCm, "heightCm", { min: 50, max: 300 })
        : user.height;
    if (heightCm) {
      values.heightCm = heightCm;
      values.bmi = calculateBmi(values.weightKg, heightCm);
    }
  }
  if (body.bodyFatPercentage !== undefined) {
    values.bodyFatPercentage = numberOrUndefined(
      body.bodyFatPercentage,
      "bodyFatPercentage",
      { min: 1, max: 80 }
    );
  }
  if (body.notes !== undefined) values.notes = String(body.notes).trim();
  if (!Object.keys(values).length) {
    throw new AppError(400, "Provide at least one progress measurement");
  }
  return values;
}

async function list(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const query = { owner: req.user.id };
  const [entries, total] = await Promise.all([
    ProgressEntry.find(query).sort({ date: -1 }).skip(skip).limit(limit),
    ProgressEntry.countDocuments(query),
  ]);
  res.json({ data: entries, pagination: createPagination({ page, limit, total }) });
}

async function summary(req, res) {
  const entries = await ProgressEntry.find({ owner: req.user.id }).sort({ date: 1 });
  const result = {
    bmi_labels: [],
    bmi_data: [],
    fat_labels: [],
    fat_data: [],
    weight_label: [],
    weight_data: [],
  };

  for (const entry of entries) {
    const date = entry.date.toISOString();
    if (entry.bmi !== undefined) {
      result.bmi_labels.push(date);
      result.bmi_data.push(entry.bmi);
    }
    if (entry.bodyFatPercentage !== undefined) {
      result.fat_labels.push(date);
      result.fat_data.push(entry.bodyFatPercentage);
    }
    if (entry.weightKg !== undefined) {
      result.weight_label.push(date);
      result.weight_data.push(entry.weightKg);
    }
  }
  res.json({ data: result });
}

async function upsert(req, res) {
  const date = normalizeDay(req.body.date || new Date());
  const user = await User.findById(req.user.id);
  const entry = await ProgressEntry.findOneAndUpdate(
    { owner: req.user.id, date },
    { $set: buildProgress(req.body, user), $setOnInsert: { owner: req.user.id, date } },
    { new: true, upsert: true, runValidators: true }
  );
  res.status(201).json({ data: entry });
}

async function remove(req, res) {
  const entry = await ProgressEntry.findOneAndDelete({
    _id: req.params.id,
    owner: req.user.id,
  });
  if (!entry) throw new AppError(404, "Progress entry not found");
  res.status(204).send();
}

module.exports = { list, summary, upsert, remove };
