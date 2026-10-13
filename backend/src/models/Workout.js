const mongoose = require("mongoose");

const workoutSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    exerciseName: { type: String, required: true, trim: true, maxlength: 120 },
    caloriesBurned: { type: Number, required: true, min: 0, max: 10000 },
    durationMinutes: { type: Number, required: true, min: 1, max: 1440 },
    date: { type: Date, required: true },
    notes: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true, collection: "workouts" }
);

workoutSchema.index({ owner: 1, date: -1 });

workoutSchema.set("toJSON", {
  transform(_document, value) {
    value.user_id = String(value.owner);
    value.name = value.exerciseName;
    value.amount = value.caloriesBurned;
    value.duration = value.durationMinutes;
    delete value.__v;
    return value;
  },
});

module.exports = mongoose.model("Workout", workoutSchema);
