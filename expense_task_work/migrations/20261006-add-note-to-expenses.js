const { DataTypes } = require("sequelize");

module.exports = {
    async up(queryInterface) {
        const columns = await queryInterface.describeTable("expenses");
        if (!columns.note) {
            await queryInterface.addColumn("expenses", "note", {
                type: DataTypes.STRING(500),
                allowNull: true,
                defaultValue: null
            });
        }
    },

    async down(queryInterface) {
        const columns = await queryInterface.describeTable("expenses");
        if (columns.note) {
            await queryInterface.removeColumn("expenses", "note");
        }
    }
};
