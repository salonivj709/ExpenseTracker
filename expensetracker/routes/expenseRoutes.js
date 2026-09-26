const express = require("express");

const expenseController =
    require("../controller/expenseController");

const router = express.Router();


// Add Expense
router.post(
    "/expenses",
    expenseController.addExpense
);


// Get Expenses
router.get(
    "/expenses",
    expenseController.getExpenses
);


// Delete Expense
router.delete(
    "/expenses/:id",
    expenseController.deleteExpense
);


// Update Expense
router.put(
    "/expenses/:id",
    expenseController.updateExpense
);


module.exports = router;