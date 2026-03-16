const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Invoice = sequelize.define('Invoice', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    invoiceNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    invoiceDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'),
      defaultValue: 'Draft',
    },
    // Customer / Client info
    customerName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    customerNameAr: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    customerEmail: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    customerPhone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    customerAddress: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    customerTaxId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Totals
    subtotal: {
      type: DataTypes.DECIMAL(15, 3),
      allowNull: false,
      defaultValue: 0,
    },
    taxRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },
    taxAmount: {
      type: DataTypes.DECIMAL(15, 3),
      allowNull: false,
      defaultValue: 0,
    },
    discount: {
      type: DataTypes.DECIMAL(15, 3),
      allowNull: false,
      defaultValue: 0,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(15, 3),
      allowNull: false,
      defaultValue: 0,
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'QAR',
    },
    // Payment
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    paymentDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    // Notes
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    notesAr: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Link to transaction (optional)
    transactionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    // Who created it
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  }, {
    tableName: 'invoices',
    timestamps: true,
  });

  return Invoice;
};
