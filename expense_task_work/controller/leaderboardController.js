const { fn, col, literal } = require("sequelize");
const User = require("../models/user");
const Expense = require("../models/expenses");

const getLeaderboard = async (req, res) => {
    try {
        if (!req.user.premium) {
            return res.status(403).json({
                success: false,
                message: "Leaderboard is available for premium users only"
            });
        }

        // One Sequelize query with a SQL JOIN + aggregation.
        // This avoids fetching users first and then running one query
        // per user (the N+1 query problem).
        const users = await User.findAll({
            attributes: [
                "id",
                "name",
                [
                    fn("COALESCE", fn("SUM", col("Expenses.amount")), 0),
                    "totalExpense"
                ]
            ],
            include: [
                {
                    model: Expense,
                    attributes: [],
                    required: false
                }
            ],
            group: ["User.id", "User.name"],
            order: [
                [literal("totalExpense"), "DESC"],
                ["name", "ASC"]
            ]
        });

        const leaderboard = users.map((user, index) => ({
            rank: index + 1,
            id: user.id,
            name: user.name,
            totalExpense: Number(user.get("totalExpense") || 0)
        }));

        return res.status(200).json({
            success: true,
            leaderboard
        });
    } catch (error) {
        console.error("Leaderboard error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch leaderboard"
        });
    }
};

module.exports = { getLeaderboard };
