const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SupplierTransaction = sequelize.define('SupplierTransaction', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    WarehouseNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    HScode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    Barcode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ProductNameArabic: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ProductNameEnglish: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    TransactionType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    TransactionDatetime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    Quantity: {
      type: DataTypes.DECIMAL(15, 3),
      allowNull: false,
    },
    SalesPrice: {
      type: DataTypes.DECIMAL(15, 3),
      allowNull: true,
    },
    NoOfInvoices: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    SupplierCategory: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ToCPNumberB2B: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    TransactionRefNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    CountryOfOrigin: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    Brand: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    UnitOfMeasurement: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    UnitWeightSize: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    PackageUnitOfMeasurement: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    UnitItemBarcode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    FromCPNumberB2B: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    IsSupplier: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }, {
    tableName: 'supplier_transactions',
    timestamps: true,
  });

  return SupplierTransaction;
};
