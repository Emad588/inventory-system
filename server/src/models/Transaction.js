const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Transaction = sequelize.define('Transaction', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    transactionRefNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    warehouseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    productId: {
      type: DataTypes.INTEGER,
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
    transactionType: {
      type: DataTypes.ENUM('Sale', 'Return', 'Transfer'),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.DECIMAL(15, 3),
      allowNull: false,
    },
    salesPrice: {
      type: DataTypes.DECIMAL(15, 3),
      allowNull: true,
    },
    noOfInvoices: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    supplierCategory: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    transactionDatetime: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    countryOfOrigin: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    brand: {
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
    packageUnitOfMeasurement: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    unitItemBarcode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    fromCPNumberB2B: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    toCPNumberB2B: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isSupplier: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  }, {
    tableName: 'transactions',
    timestamps: true,
  });

  return Transaction;
};
