const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PurchaseOrderItem = sequelize.define('PurchaseOrderItem', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    purchaseOrderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.DECIMAL(15, 3),
      allowNull: false,
    },
    unitPrice: {
      type: DataTypes.DECIMAL(15, 3),
      allowNull: false,
    },
    total: {
      type: DataTypes.DECIMAL(15, 3),
      allowNull: false,
    },
  }, {
    tableName: 'purchase_order_items',
    timestamps: true,
  });

  return PurchaseOrderItem;
};
