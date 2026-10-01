const { DataTypes } = require("sequelize");

const db = require("../utils/db-connection");

const User = db.define(
    "User",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },

        name: {
            type: DataTypes.STRING,
            allowNull: false
        },

        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },

        password: {
            type: DataTypes.STRING,
            allowNull: false
        },

        premium: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },

        // Cached running total used by the leaderboard.
        // Keeping this on the user avoids recalculating SUM(expenses.amount)
        // every time the leaderboard is requested.
        totalExpense: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0
        }
    },
    {
        tableName: "users",
        timestamps: false
    }
);

module.exports = User;