const { DataTypes } = require("sequelize");
const db = require("../utils/db-connection");

const ForgotPasswordRequest = db.define(
    "ForgotPasswordRequest",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "users",
                key: "id"
            }
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: false
        }
    },
    {
        tableName: "ForgotPasswordRequests",
        timestamps: true
    }
);

module.exports = ForgotPasswordRequest;
