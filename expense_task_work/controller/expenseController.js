const Expense = require("../models/expenses");

// ADD EXPENSE
const addExpense = async (req, res) => {

    try {

        const {
            amount,
            description,
            category
        } = req.body;


        if (
            !amount ||
            !description ||
            !category
        ) {

            return res.status(400).json({

                success: false,

                message: "All fields are required"

            });
        }


        // IMPORTANT
        // User comes from JWT

        const expense =
            await Expense.create({

                amount: amount,

                description: description,

                category: category,

                userId: req.user.id

            });


        return res.status(201).json({

            success: true,

            message: "Expense added successfully",

            expense: expense

        });


    } catch (error) {

        console.log(error);

        return res.status(500).json({

            success: false,

            message: "Error adding expense"

        });
    }
};



// =====================================
// GET EXPENSES
// =====================================

const getExpenses = async (req, res) => {

    try {

        const expenses =
            await Expense.findAll({

                where: {

                    // ONLY CURRENT USER
                    userId: req.user.id

                },

                order: [
                    ["id", "DESC"]
                ]

            });


        return res.status(200).json({

            success: true,

            message: "Expenses fetched successfully",

            expenses: expenses

        });


    } catch (error) {

        console.log(error);

        return res.status(500).json({

            success: false,

            message: "Error fetching expenses"

        });
    }
};



// =====================================
// DELETE EXPENSE
// =====================================

const deleteExpense = async (req, res) => {

    try {

        const id = req.params.id;


        // Find expense belonging
        // to CURRENT USER

        const expense =
            await Expense.findOne({

                where: {

                    id: id,

                    userId: req.user.id

                }

            });


        if (!expense) {

            return res.status(404).json({

                success: false,

                message: "Expense not found"

            });
        }


        await expense.destroy();


        return res.status(200).json({

            success: true,

            message: "Expense deleted successfully"

        });


    } catch (error) {

        console.log(error);

        return res.status(500).json({

            success: false,

            message: "Error deleting expense"

        });
    }
};



// =====================================
// UPDATE EXPENSE
// =====================================

const updateExpense = async (req, res) => {

    try {

        const id = req.params.id;


        const {
            amount,
            description,
            category
        } = req.body;


        // VERY IMPORTANT
        // Only find expense belonging
        // to logged-in user

        const expense =
            await Expense.findOne({

                where: {

                    id: id,

                    userId: req.user.id

                }

            });


        if (!expense) {

            return res.status(404).json({

                success: false,

                message: "Expense not found"

            });
        }


        await expense.update({

            amount: amount,

            description: description,

            category: category

        });


        return res.status(200).json({

            success: true,

            message: "Expense updated successfully",

            expense: expense

        });


    } catch (error) {

        console.log(error);

        return res.status(500).json({

            success: false,

            message: "Error updating expense"

        });
    }
};



module.exports = {

    addExpense,

    getExpenses,

    deleteExpense,

    updateExpense

};