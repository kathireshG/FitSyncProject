const NutritionEntry = require("../models/NutritionEntry");
const AppError = require("../utils/AppError");
const { requireFields, numberOrUndefined, parseDate } = require("../utils/validation");
const { getPagination, createPagination } = require("../utils/pagination");

function buildEntry(body, partial = false) {
  if (!partial) requireFields(body, ["foodName", "calories", "date"]);
  const values = {};
  if (body.foodName !== undefined) values.foodName = String(body.foodName).trim();
  if (body.calories !== undefined) values.calories = numberOrUndefined(body.calories, "calories", { min: 0, max: 20000 });
  for (const field of ["proteinGrams", "carbohydrateGrams", "fatGrams"]) {
    if (body[field] !== undefined) values[field] = numberOrUndefined(body[field], field, { min: 0, max: 2000 });
  }
  if (body.date !== undefined) values.date = parseDate(body.date);
  return values;
}

async function list(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const query = { owner: req.user.id };
  if (req.query.from || req.query.to) {
    query.date = {};
    if (req.query.from) query.date.$gte = parseDate(req.query.from, "from");
    if (req.query.to) query.date.$lte = parseDate(req.query.to, "to");
  }
  const [entries, total] = await Promise.all([
    NutritionEntry.find(query).sort({ date: -1, createdAt: -1 }).skip(skip).limit(limit),
    NutritionEntry.countDocuments(query),
  ]);
  res.json({ data: entries, pagination: createPagination({ page, limit, total }) });
}

async function create(req, res) {
  const entry = await NutritionEntry.create({ owner: req.user.id, ...buildEntry(req.body) });
  res.status(201).json({ data: entry });
}

async function update(req, res) {
  const entry = await NutritionEntry.findOneAndUpdate(
    { _id: req.params.id, owner: req.user.id },
    buildEntry(req.body, true),
    { new: true, runValidators: true }
  );
  if (!entry) throw new AppError(404, "Nutrition entry not found");
  res.json({ data: entry });
}

async function remove(req, res) {
  const entry = await NutritionEntry.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
  if (!entry) throw new AppError(404, "Nutrition entry not found");
  res.status(204).send();
}

module.exports = { list, create, update, remove };
