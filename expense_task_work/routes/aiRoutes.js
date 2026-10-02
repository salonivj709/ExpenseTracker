const express = require("express");
const aiController = require("../controller/aiController");
const authenticate = require("../middleware/auth");

const router = express.Router();

// AI expense category suggestion.
router.post(
    "/categorize",
    authenticate,
    aiController.categorizeExpense
);

// AI monthly budget planner.
router.post(
    "/budget-plan",
    authenticate,
    aiController.generateBudgetPlan
);

module.exports = router;
