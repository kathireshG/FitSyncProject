const router = require("express").Router();
const authenticate = require("../middleware/authenticate");
const asyncHandler = require("../utils/asyncHandler");
const controller = require("../controllers/dashboardController");

router.use(authenticate);
router.get("/summary", asyncHandler(controller.summary));
router.get("/leaderboard", asyncHandler(controller.leaderboard));

module.exports = router;
