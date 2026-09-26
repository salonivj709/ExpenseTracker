const Expense = require("../models/expenses");

// ADD EXPENSE
const addExpense = async (req, res) => {

    try {

        const {
            amount,
            description,
            category
        } = req.body;

        const expense = await Expense.create({
            amount,
            description,
            category
        });

        res.status(201).send({
            message: "Expense added successfully",
            data: expense
        });

    } catch (err) {

        console.log(err.message);

        res.status(500).send({
            message: "Error adding expense",
            error: err.message
        });

    }

};


// GET ALL EXPENSES
const getExpenses = async (req, res) => {

    try {

        const expenses = await Expense.findAll({
            order: [["id", "DESC"]]
        });

        res.status(200).send({
            message: "Expenses fetched successfully",
            data: expenses
        });

    } catch (err) {

        res.status(500).send({
            message: "Error fetching expenses",
            error: err.message
        });

    }

};


// DELETE EXPENSE
const deleteExpense = async (req, res) => {

    try {

        const id = req.params.id;

        const expense = await Expense.findByPk(id);

        if (!expense) {

            return res.status(404).send({
                message: "Expense not found"
            });

        }

        await expense.destroy();

        res.status(200).send({
            message: "Expense deleted successfully"
        });

    } catch (err) {

        res.status(500).send({
            message: "Error deleting expense",
            error: err.message
        });

    }

};


// UPDATE EXPENSE
const updateExpense = async (req, res) => {

    try {

        const id = req.params.id;

        const {
            amount,
            description,
            category
        } = req.body;

        const expense = await Expense.findByPk(id);

        if (!expense) {

            return res.status(404).send({
                message: "Expense not found"
            });

        }

        await expense.update({
            amount,
            description,
            category
        });

        res.status(200).send({
            message: "Expense updated successfully",
            data: expense
        });

    } catch (err) {

        res.status(500).send({
            message: "Error updating expense",
            error: err.message
        });

    }

};


module.exports = {
    addExpense,
    getExpenses,
    deleteExpense,
    updateExpense
};