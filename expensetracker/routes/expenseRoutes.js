const express = require("express");

const expenseController =
    require("../controller/expenseController");

const authenticate =
    require("../middleware/auth");

const router = express.Router();


// =================================
// ADD EXPENSE
// =================================

router.post(

    "/expenses",

    authenticate,

    expenseController.addExpense

);



// =================================
// GET EXPENSES
// =================================

router.get(

    "/expenses",

    authenticate,

    expenseController.getExpenses

);



// =================================
// DELETE EXPENSE
// =================================

router.delete(

    "/expenses/:id",

    authenticate,

    expenseController.deleteExpense

);



// =================================
// UPDATE EXPENSE
// =================================

router.put(

    "/expenses/:id",

    authenticate,

    expenseController.updateExpense

);


module.exports = router;