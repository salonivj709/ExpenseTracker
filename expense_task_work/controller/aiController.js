const Expense = require("../models/expenses");
const { suggestCategory, createBudgetPlan } = require("../ai");

const categorizeExpense = async (req, res) => {
    try {
        const { description } = req.body;

        if (!description || !String(description).trim()) {
            return res.status(400).json({
                success: false,
                message: "Expense description is required"
            });
        }

        const category = await suggestCategory(description);

        return res.status(200).json({
            success: true,
            category
        });
    } catch (error) {
        console.error(
            "AI category suggestion error:",
            error.response?.data || error.message
        );

        const apiStatus = error.response?.status;
        const status = [400, 401, 403, 404, 429].includes(apiStatus)
            ? apiStatus
            : 503;

        return res.status(status).json({
            success: false,
            message: "AI category suggestion is temporarily unavailable. You can choose a category manually."
        });
    }
};

const generateBudgetPlan = async (req, res) => {
    try {
        const monthlyIncome = Number(req.body.monthlyIncome);
        const savingsGoal = req.body.savingsGoal === "" || req.body.savingsGoal == null
            ? null
            : Number(req.body.savingsGoal);

        if (!Number.isFinite(monthlyIncome) || monthlyIncome <= 0) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid monthly income."
            });
        }

        if (savingsGoal !== null && (!Number.isFinite(savingsGoal) || savingsGoal < 0 || savingsGoal >= monthlyIncome)) {
            return res.status(400).json({
                success: false,
                message: "Savings goal must be 0 or more and less than your monthly income."
            });
        }

        const expenses = await Expense.findAll({
            where: { userId: req.user.id },
            attributes: ["amount", "category"],
            raw: true
        });

        const categoryTotals = {};
        let totalRecorded = 0;

        expenses.forEach((expense) => {
            const amount = Number(expense.amount) || 0;
            const category = expense.category || "Other";
            totalRecorded += amount;
            categoryTotals[category] = (categoryTotals[category] || 0) + amount;
        });

        const budget = await createBudgetPlan({
            monthlyIncome,
            savingsGoal,
            totalRecorded,
            categoryTotals
        });

        return res.status(200).json({
            success: true,
            budget
        });
    } catch (error) {
        console.error(
            "AI budget planner error:",
            error.response?.data || error.message
        );

        const apiStatus = error.response?.status;
        const status = [400, 401, 403, 404, 429].includes(apiStatus)
            ? apiStatus
            : 503;

        return res.status(status).json({
            success: false,
            message: "AI budget planner is temporarily unavailable. Please try again in a moment."
        });
    }
};

module.exports = {
    categorizeExpense,
    generateBudgetPlan
};
