const { DataTypes } = require("sequelize");

const db = require("../utils/db-connection");

const Expense = db.define(
    "Expense",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },

        amount: {
            type: DataTypes.FLOAT,
            allowNull: false
        },

        description: {
            type: DataTypes.STRING,
            allowNull: false
        },

        category: {
            type: DataTypes.STRING,
            allowNull: false
        },

        note: {
            type: DataTypes.STRING(500),
            allowNull: true,
            defaultValue: null
        },

        userId: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    },
    {
        tableName: "expenses",
        timestamps: false
    }
);

module.exports = Expense;