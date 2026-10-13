const router = require("express").Router();
const authenticate = require("../middleware/authenticate");
const asyncHandler = require("../utils/asyncHandler");
const controller = require("../controllers/nutritionController");

router.use(authenticate);
router.get("/", asyncHandler(controller.list));
router.post("/", asyncHandler(controller.create));
router.patch("/:id", asyncHandler(controller.update));
router.delete("/:id", asyncHandler(controller.remove));

module.exports = router;
