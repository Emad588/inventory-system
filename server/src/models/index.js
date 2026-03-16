const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

let sequelize;
if (dbConfig.dialect === 'sqlite') {
  // Ensure data directory exists
  const dataDir = path.dirname(dbConfig.storage);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbConfig.storage,
    logging: dbConfig.logging,
    dialectModule: require('../utils/sqlite3-compat'),
  });
} else {
  sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
      host: dbConfig.host,
      port: dbConfig.port,
      dialect: dbConfig.dialect,
      logging: dbConfig.logging,
      pool: dbConfig.pool,
    }
  );
}

const User = require('./User')(sequelize);
const Product = require('./Product')(sequelize);
const Warehouse = require('./Warehouse')(sequelize);
const Transaction = require('./Transaction')(sequelize);
const SupplierTransaction = require('./SupplierTransaction')(sequelize);
const AuditLog = require('./AuditLog')(sequelize);
const Invoice = require('./Invoice')(sequelize);
const InvoiceItem = require('./InvoiceItem')(sequelize);
const Customer = require('./Customer')(sequelize);
const Supplier = require('./Supplier')(sequelize);
const PurchaseOrder = require('./PurchaseOrder')(sequelize);
const PurchaseOrderItem = require('./PurchaseOrderItem')(sequelize);

// Associations
Product.hasMany(Transaction, { foreignKey: 'productId' });
Transaction.belongsTo(Product, { foreignKey: 'productId' });

Warehouse.hasMany(Transaction, { foreignKey: 'warehouseId' });
Transaction.belongsTo(Warehouse, { foreignKey: 'warehouseId' });

User.hasMany(Transaction, { foreignKey: 'createdBy' });
Transaction.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

User.hasMany(AuditLog, { foreignKey: 'userId' });
AuditLog.belongsTo(User, { foreignKey: 'userId' });

// Billing associations
Invoice.hasMany(InvoiceItem, { foreignKey: 'invoiceId', as: 'items', onDelete: 'CASCADE' });
InvoiceItem.belongsTo(Invoice, { foreignKey: 'invoiceId' });

InvoiceItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

Invoice.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(Invoice, { foreignKey: 'createdBy' });

Invoice.belongsTo(Transaction, { foreignKey: 'transactionId', as: 'transaction' });

// Purchase Order associations
PurchaseOrder.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });
Supplier.hasMany(PurchaseOrder, { foreignKey: 'supplierId' });

PurchaseOrder.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(PurchaseOrder, { foreignKey: 'createdBy' });

PurchaseOrder.hasMany(PurchaseOrderItem, { foreignKey: 'purchaseOrderId', as: 'items', onDelete: 'CASCADE' });
PurchaseOrderItem.belongsTo(PurchaseOrder, { foreignKey: 'purchaseOrderId' });

PurchaseOrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

module.exports = {
  sequelize,
  Sequelize,
  User,
  Product,
  Warehouse,
  Transaction,
  SupplierTransaction,
  AuditLog,
  Invoice,
  InvoiceItem,
  Customer,
  Supplier,
  PurchaseOrder,
  PurchaseOrderItem,
};
