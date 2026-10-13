const fs = require("fs");
const path = require("path");
const User = require("../models/User");
const env = require("../config/env");
const AppError = require("../utils/AppError");

async function deleteAvatarFile(filename) {
  if (!filename) return;
  const safeName = path.basename(filename);
  try {
    await fs.promises.unlink(path.join(env.uploadDirectory, safeName));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

async function uploadAvatar(req, res) {
  if (!req.file) throw new AppError(400, "An avatar image is required");

  const oldFilename = req.user.avatar?.filename;
  const avatar = {
    filename: req.file.filename,
    url: `/uploads/avatars/${req.file.filename}`,
    mimetype: req.file.mimetype,
    size: req.file.size,
  };
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { avatar },
    { new: true, runValidators: true }
  );
  await deleteAvatarFile(oldFilename);
  res.status(201).json({ avatar: user.avatar });
}

async function deleteAvatar(req, res) {
  const oldFilename = req.user.avatar?.filename;
  await User.findByIdAndUpdate(req.user.id, { $unset: { avatar: 1 } });
  await deleteAvatarFile(oldFilename);
  res.status(204).send();
}

module.exports = { uploadAvatar, deleteAvatar };
