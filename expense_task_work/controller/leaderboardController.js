const User = require("../models/user");

const getLeaderboard = async (req, res) => {
    try {
        if (!req.user.premium) {
            return res.status(403).json({
                success: false,
                message: "Leaderboard is available for premium users only"
            });
        }

        // Optimized leaderboard: totalExpense is already maintained on the
        // users table whenever an expense is created, updated or deleted.
        // Therefore this request needs only one simple indexed user-table query
        // instead of joining/grouping the expenses table for every request.
        const users = await User.findAll({
            attributes: ["id", "name", "totalExpense"],
            order: [
                ["totalExpense", "DESC"],
                ["name", "ASC"]
            ]
        });

        const leaderboard = users.map((user, index) => ({
            rank: index + 1,
            id: user.id,
            name: user.name,
            totalExpense: Number(user.totalExpense || 0)
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
