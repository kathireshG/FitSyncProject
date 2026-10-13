const mongoose = require("mongoose");

const nutritionEntrySchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    foodName: { type: String, required: true, trim: true, maxlength: 120 },
    calories: { type: Number, required: true, min: 0, max: 20000 },
    proteinGrams: { type: Number, min: 0, max: 2000 },
    carbohydrateGrams: { type: Number, min: 0, max: 2000 },
    fatGrams: { type: Number, min: 0, max: 1000 },
    date: { type: Date, required: true },
  },
  { timestamps: true, collection: "nutrition_entries" }
);

nutritionEntrySchema.index({ owner: 1, date: -1 });

nutritionEntrySchema.set("toJSON", {
  transform(_document, value) {
    value.user_id = String(value.owner);
    value.name = value.foodName;
    value.amount = value.calories;
    delete value.__v;
    return value;
  },
});

module.exports = mongoose.model("NutritionEntry", nutritionEntrySchema);
