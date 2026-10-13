const router = require("express").Router();
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const asyncHandler = require("../utils/asyncHandler");
const controller = require("../controllers/userController");

router.use(authenticate);
router.get("/me", controller.getMe);
router.patch("/me", asyncHandler(controller.updateMe));
router.patch("/me/password", asyncHandler(controller.changePassword));
router.get("/", authorize("admin"), asyncHandler(controller.listUsers));

module.exports = router;
