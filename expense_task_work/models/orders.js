const { DataTypes } = require("sequelize");
const db = require("../utils/db-connection");

const PaymentOrder = db.define(
    "PaymentOrder",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },

        orderId: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true
        },

        cfOrderId: {
            type: DataTypes.STRING(100),
            allowNull: true
        },

        userId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },

        status: {
            type: DataTypes.ENUM("PENDING", "SUCCESS", "FAILED"),
            allowNull: false,
            defaultValue: "PENDING"
        }
    },
    {
        tableName: "orders",
        timestamps: true
    }
);

module.exports = PaymentOrder;
