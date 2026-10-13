const router = require("express").Router();
const authenticate = require("../middleware/authenticate");
const asyncHandler = require("../utils/asyncHandler");
const controller = require("../controllers/progressController");

router.use(authenticate);
router.get("/", asyncHandler(controller.list));
router.get("/summary", asyncHandler(controller.summary));
router.post("/", asyncHandler(controller.upsert));
router.delete("/:id", asyncHandler(controller.remove));

module.exports = router;
