const { Sequelize } = require("sequelize");

const db = new Sequelize(
    "expense_db",
    "root",
    "root123",
    {
        host: "localhost",
        dialect: "mysql",
        logging: console.log
    }
);

module.exports = db;