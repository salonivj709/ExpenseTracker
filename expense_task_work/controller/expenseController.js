const Expense = require("../models/expenses");
const User = require("../models/user");
const db = require("../utils/db-connection");

// ADD EXPENSE
const addExpense = async (req, res) => {
    const transaction = await db.transaction();

    try {
        const { amount, description, category } = req.body;
        const numericAmount = Number(amount);

        if (!Number.isFinite(numericAmount) || numericAmount <= 0 || !description || !category) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: "Enter a valid amount, description and category"
            });
        }

        const expense = await Expense.create(
            {
                amount: numericAmount,
                description,
                category,
                userId: req.user.id
            },
            { transaction }
        );

        // Maintain the cached total atomically. This is the key optimization:
        // the leaderboard no longer has to SUM the expenses table.
        await User.increment(
            { totalExpense: numericAmount },
            { where: { id: req.user.id }, transaction }
        );

        await transaction.commit();

        return res.status(201).json({
            success: true,
            message: "Expense added successfully",
            expense
        });
    } catch (error) {
        await transaction.rollback().catch(() => {});
        console.error("Add expense error:", error);

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
    const transaction = await db.transaction();

    try {
        const expense = await Expense.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id
            },
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (!expense) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: "Expense not found"
            });
        }

        const amount = Number(expense.amount);

        await expense.destroy({ transaction });

        // Remove the deleted amount from the cached user total.
        await User.increment(
            { totalExpense: -amount },
            { where: { id: req.user.id }, transaction }
        );

        await transaction.commit();

        return res.status(200).json({
            success: true,
            message: "Expense deleted successfully"
        });
    } catch (error) {
        await transaction.rollback().catch(() => {});
        console.error("Delete expense error:", error);

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
    const transaction = await db.transaction();

    try {
        const { amount, description, category } = req.body;
        const newAmount = Number(amount);

        if (!Number.isFinite(newAmount) || newAmount <= 0 || !description || !category) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: "Enter a valid amount, description and category"
            });
        }

        const expense = await Expense.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id
            },
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (!expense) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: "Expense not found"
            });
        }

        const oldAmount = Number(expense.amount);
        const difference = newAmount - oldAmount;

        await expense.update(
            {
                amount: newAmount,
                description,
                category
            },
            { transaction }
        );

        if (difference !== 0) {
            await User.increment(
                { totalExpense: difference },
                { where: { id: req.user.id }, transaction }
            );
        }

        await transaction.commit();

        return res.status(200).json({
            success: true,
            message: "Expense updated successfully",
            expense
        });
    } catch (error) {
        await transaction.rollback().catch(() => {});
        console.error("Update expense error:", error);

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