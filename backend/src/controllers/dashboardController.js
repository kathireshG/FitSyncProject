const mongoose = require("mongoose");
const Workout = require("../models/Workout");
const NutritionEntry = require("../models/NutritionEntry");
const ProgressEntry = require("../models/ProgressEntry");
const { getPagination, createPagination } = require("../utils/pagination");

async function summary(req, res) {
  const owner = req.user.id;
  const from = new Date();
  from.setUTCDate(from.getUTCDate() - 30);

  const [workoutTotals, nutritionTotals, latestProgress, recentWorkouts] =
    await Promise.all([
      Workout.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(owner), date: { $gte: from } } },
        {
          $group: {
            _id: null,
            workouts: { $sum: 1 },
            caloriesBurned: { $sum: "$caloriesBurned" },
            durationMinutes: { $sum: "$durationMinutes" },
          },
        },
      ]),
      NutritionEntry.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(owner), date: { $gte: from } } },
        { $group: { _id: null, caloriesConsumed: { $sum: "$calories" } } },
      ]),
      ProgressEntry.findOne({ owner }).sort({ date: -1 }),
      Workout.find({ owner }).sort({ date: -1 }).limit(5),
    ]);

  res.json({
    data: {
      periodDays: 30,
      workouts: workoutTotals[0]?.workouts || 0,
      caloriesBurned: workoutTotals[0]?.caloriesBurned || 0,
      durationMinutes: workoutTotals[0]?.durationMinutes || 0,
      caloriesConsumed: nutritionTotals[0]?.caloriesConsumed || 0,
      latestProgress,
      recentWorkouts,
    },
  });
}

async function leaderboard(req, res) {
  const { page, limit, skip } = getPagination(req.query, { defaultLimit: 5, maxLimit: 50 });
  const from = new Date();
  from.setUTCDate(from.getUTCDate() - 7);

  const [result] = await Workout.aggregate([
    { $match: { date: { $gte: from } } },
    {
      $group: {
        _id: "$owner",
        averageDurationMinutes: { $avg: "$durationMinutes" },
        workoutCount: { $sum: 1 },
      },
    },
    { $sort: { averageDurationMinutes: -1, _id: 1 } },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $project: {
        _id: 0,
        userId: "$_id",
        name: "$user.name",
        averageDurationMinutes: { $round: ["$averageDurationMinutes", 1] },
        workoutCount: 1,
      },
    },
    {
      $facet: {
        data: [{ $skip: skip }, { $limit: limit }],
        metadata: [{ $count: "total" }],
      },
    },
  ]);
  const total = result.metadata[0]?.total || 0;
  res.json({ data: result.data, pagination: createPagination({ page, limit, total }) });
}

module.exports = { summary, leaderboard };
