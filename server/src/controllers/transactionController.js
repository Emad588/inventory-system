const { Transaction, Product, Warehouse, SupplierTransaction, sequelize } = require('../models');
const { Op } = require('sequelize');
const { logAction } = require('../utils/auditLogger');

exports.getAll = async (req, res) => {
  try {
    const { search, type, warehouseId, dateFrom, dateTo, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (search) {
      where[Op.or] = [
        { transactionRefNumber: { [Op.like]: `%${search}%` } },
        { barcode: { [Op.like]: `%${search}%` } },
      ];
    }
    if (type) where.transactionType = type;
    if (warehouseId) where.warehouseId = warehouseId;
    if (dateFrom || dateTo) {
      where.transactionDatetime = {};
      if (dateFrom) where.transactionDatetime[Op.gte] = new Date(dateFrom);
      if (dateTo) where.transactionDatetime[Op.lte] = new Date(dateTo);
    }

    const { rows: transactions, count: total } = await Transaction.findAndCountAll({
      where,
      include: [
        { model: Product, attributes: ['productNameEn', 'productNameAr'] },
        { model: Warehouse, attributes: ['warehouseNumber', 'warehouseName'] },
      ],
      order: [['transactionDatetime', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const transaction = await Transaction.findByPk(req.params.id, {
      include: [
        { model: Product },
        { model: Warehouse },
      ],
    });
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
    res.json({ transaction });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const product = await Product.findByPk(req.body.productId);
    const warehouse = await Warehouse.findByPk(req.body.warehouseId);

    if (!product) return res.status(400).json({ error: 'Product not found' });
    if (!warehouse) return res.status(400).json({ error: 'Warehouse not found' });

    // Auto-fill fields from product if not provided
    const txData = {
      ...req.body,
      barcode: req.body.barcode || product.barcode,
      hsCode: req.body.hsCode || product.hsCode,
      countryOfOrigin: req.body.countryOfOrigin || product.countryOfOrigin,
      brand: req.body.brand || product.brand,
      unitOfMeasurement: req.body.unitOfMeasurement || product.unitOfMeasurement,
      unitWeightSize: req.body.unitWeightSize || product.unitWeightSize,
      createdBy: req.user.id,
    };

    const transaction = await Transaction.create(txData);

    // Also insert into SupplierTransactions (MOCI format)
    await SupplierTransaction.create({
      WarehouseNumber: warehouse.warehouseNumber,
      HScode: txData.hsCode,
      Barcode: txData.barcode,
      ProductNameArabic: product.productNameAr,
      ProductNameEnglish: product.productNameEn,
      TransactionType: txData.transactionType,
      TransactionDatetime: txData.transactionDatetime,
      Quantity: txData.quantity,
      SalesPrice: txData.salesPrice,
      NoOfInvoices: txData.noOfInvoices,
      SupplierCategory: txData.supplierCategory,
      ToCPNumberB2B: txData.toCPNumberB2B,
      TransactionRefNumber: txData.transactionRefNumber,
      CountryOfOrigin: txData.countryOfOrigin,
      Brand: txData.brand,
      UnitOfMeasurement: txData.unitOfMeasurement,
      UnitWeightSize: txData.unitWeightSize,
      PackageUnitOfMeasurement: txData.packageUnitOfMeasurement,
      UnitItemBarcode: txData.unitItemBarcode,
      FromCPNumberB2B: txData.fromCPNumberB2B,
      IsSupplier: txData.isSupplier,
    });

    await logAction('CREATE', 'Transaction', transaction.id, txData, req.user.id, req.ip);

    const result = await Transaction.findByPk(transaction.id, {
      include: [{ model: Product }, { model: Warehouse }],
    });

    res.status(201).json({ transaction: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const transaction = await Transaction.findByPk(req.params.id);
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });

    await transaction.update(req.body);
    await logAction('UPDATE', 'Transaction', transaction.id, req.body, req.user.id, req.ip);

    const result = await Transaction.findByPk(transaction.id, {
      include: [{ model: Product }, { model: Warehouse }],
    });

    res.json({ transaction: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const transaction = await Transaction.findByPk(req.params.id);
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });

    await transaction.destroy();
    await logAction('DELETE', 'Transaction', req.params.id, {}, req.user.id, req.ip);
    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
