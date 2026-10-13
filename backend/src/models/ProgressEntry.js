const mongoose = require("mongoose");

const progressEntrySchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    weightKg: { type: Number, min: 20, max: 500 },
    heightCm: { type: Number, min: 50, max: 300 },
    bmi: { type: Number, min: 5, max: 100 },
    bodyFatPercentage: { type: Number, min: 1, max: 80 },
    notes: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true, collection: "progress_entries" }
);

progressEntrySchema.index({ owner: 1, date: -1 }, { unique: true });

module.exports = mongoose.model("ProgressEntry", progressEntrySchema);
