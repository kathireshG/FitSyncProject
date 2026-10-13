const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const avatarSchema = new mongoose.Schema(
  {
    filename: String,
    url: String,
    mimetype: String,
    size: Number,
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    height: { type: Number, min: 50, max: 300 },
    weight: { type: Number, min: 20, max: 500 },
    goalWeight: { type: Number, min: 20, max: 500 },
    dob: Date,
    avatar: avatarSchema,
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
  },
  { timestamps: true, collection: "users" }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  return next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.set("toJSON", {
  transform(_document, value) {
    delete value.password;
    delete value.passwordResetToken;
    delete value.passwordResetExpires;
    delete value.__v;
    return value;
  },
});

module.exports = mongoose.model("User", userSchema);
