const db = require("../utils/db-connection");
const User = require("../models/user");

const getLeaderboard = async (req, res) => {
    try {
        if (!req.user.premium) {
            return res.status(403).json({
                success: false,
                message: "Leaderboard is available for premium users only"
            });
        }

        const [rows] = await db.query(`
            SELECT
                u.id,
                u.name,
                COALESCE(SUM(e.amount), 0) AS totalExpense
            FROM users u
            LEFT JOIN expenses e ON e.userId = u.id
            GROUP BY u.id, u.name
            ORDER BY totalExpense DESC, u.name ASC
        `);

        const leaderboard = rows.map((row, index) => ({
            rank: index + 1,
            id: row.id,
            name: row.name,
            totalExpense: Number(row.totalExpense || 0)
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
