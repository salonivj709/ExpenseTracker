require("dotenv").config();

const { QueryTypes } = require("sequelize");
const db = require("./db-connection");

async function backfill() {
    try {
        await db.authenticate();
        await db.sync({ alter: true });

        // One-time migration for existing data. After this, the running
        // application maintains totalExpense incrementally, so the
        // leaderboard never needs to scan the expenses table.
        await db.query(`
            UPDATE users u
            LEFT JOIN (
                SELECT userId, SUM(amount) AS totalExpense
                FROM expenses
                GROUP BY userId
            ) e ON e.userId = u.id
            SET u.totalExpense = COALESCE(e.totalExpense, 0)
        `, { type: QueryTypes.UPDATE });

        console.log("totalExpense backfill completed successfully.");
    } catch (error) {
        console.error("Backfill failed:", error);
        process.exitCode = 1;
    } finally {
        await db.close();
    }
}

backfill();
