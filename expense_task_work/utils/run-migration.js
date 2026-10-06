require("dotenv").config();
const db = require("./db-connection");
const migration = require("../migrations/20261006-add-note-to-expenses");

async function main() {
    const direction = process.argv[2] || "up";
    if (!["up", "down"].includes(direction)) {
        throw new Error("Usage: node utils/run-migration.js [up|down]");
    }

    try {
        await db.authenticate();
        const queryInterface = db.getQueryInterface();
        await migration[direction](queryInterface);
        console.log(`Expense note migration ${direction} completed successfully.`);
    } finally {
        await db.close();
    }
}

main().catch(error => {
    console.error("Expense note migration failed:", error.message);
    process.exitCode = 1;
});
