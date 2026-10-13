const Workout = require("../models/Workout");
const AppError = require("../utils/AppError");
const { requireFields, numberOrUndefined, parseDate } = require("../utils/validation");
const { getPagination, createPagination } = require("../utils/pagination");

function buildWorkout(body, partial = false) {
  if (!partial) requireFields(body, ["exerciseName", "caloriesBurned", "durationMinutes", "date"]);
  const values = {};
  if (body.exerciseName !== undefined) values.exerciseName = String(body.exerciseName).trim();
  if (body.caloriesBurned !== undefined) {
    values.caloriesBurned = numberOrUndefined(body.caloriesBurned, "caloriesBurned", { min: 0, max: 10000 });
  }
  if (body.durationMinutes !== undefined) {
    values.durationMinutes = numberOrUndefined(body.durationMinutes, "durationMinutes", { min: 1, max: 1440 });
  }
  if (body.date !== undefined) values.date = parseDate(body.date);
  if (body.notes !== undefined) values.notes = String(body.notes).trim();
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
  const [workouts, total] = await Promise.all([
    Workout.find(query).sort({ date: -1, createdAt: -1 }).skip(skip).limit(limit),
    Workout.countDocuments(query),
  ]);
  res.json({ data: workouts, pagination: createPagination({ page, limit, total }) });
}

async function create(req, res) {
  const workout = await Workout.create({ owner: req.user.id, ...buildWorkout(req.body) });
  res.status(201).json({ data: workout });
}

async function update(req, res) {
  const workout = await Workout.findOneAndUpdate(
    { _id: req.params.id, owner: req.user.id },
    buildWorkout(req.body, true),
    { new: true, runValidators: true }
  );
  if (!workout) throw new AppError(404, "Workout not found");
  res.json({ data: workout });
}

async function remove(req, res) {
  const workout = await Workout.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
  if (!workout) throw new AppError(404, "Workout not found");
  res.status(204).send();
}

module.exports = { list, create, update, remove };
