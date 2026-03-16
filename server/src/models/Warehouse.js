const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Warehouse = sequelize.define('Warehouse', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    warehouseNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    warehouseName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    tableName: 'warehouses',
    timestamps: true,
  });

  return Warehouse;
};
