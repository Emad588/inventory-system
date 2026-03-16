const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    productNameEn: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    productNameAr: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    barcode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    hsCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    brand: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    countryOfOrigin: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    unitOfMeasurement: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    unitWeightSize: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    tableName: 'products',
    timestamps: true,
  });

  return Product;
};
