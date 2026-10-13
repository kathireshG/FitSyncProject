const AppError = require("../utils/AppError");

module.exports = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new AppError(403, "You do not have permission for this action"));
  }
  return next();
};
