const router = require("express").Router();
const authenticate = require("../middleware/authenticate");
const upload = require("../middleware/avatarUpload");
const asyncHandler = require("../utils/asyncHandler");
const controller = require("../controllers/mediaController");

router.use(authenticate);
router.post("/avatar", upload.single("avatar"), asyncHandler(controller.uploadAvatar));
router.delete("/avatar", asyncHandler(controller.deleteAvatar));

module.exports = router;
