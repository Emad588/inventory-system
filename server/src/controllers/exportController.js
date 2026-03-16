const { SupplierTransaction } = require('../models');
const { Op } = require('sequelize');
const { logAction } = require('../utils/auditLogger');

const buildWhere = (query) => {
  const where = {};
  if (query.dateFrom || query.dateTo) {
    where.TransactionDatetime = {};
    if (query.dateFrom) where.TransactionDatetime[Op.gte] = new Date(query.dateFrom);
    if (query.dateTo) where.TransactionDatetime[Op.lte] = new Date(query.dateTo);
  }
  if (query.type) where.TransactionType = query.type;
  if (query.warehouse) where.WarehouseNumber = query.warehouse;
  return where;
};

exports.exportJSON = async (req, res) => {
  try {
    const where = buildWhere(req.query);
    const data = await SupplierTransaction.findAll({ where, raw: true });

    // Remove sequelize metadata fields
    const cleaned = data.map(({ id, createdAt, updatedAt, ...rest }) => rest);

    await logAction('EXPORT', 'SupplierTransaction', null, { format: 'JSON', count: cleaned.length }, req.user.id, req.ip);

    res.json({ supplierTransactions: cleaned, count: cleaned.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.exportCSV = async (req, res) => {
  try {
    const where = buildWhere(req.query);
    const data = await SupplierTransaction.findAll({ where, raw: true });

    const headers = [
      'WarehouseNumber', 'HScode', 'Barcode', 'ProductNameArabic', 'ProductNameEnglish',
      'TransactionType', 'TransactionDatetime', 'Quantity', 'SalesPrice', 'NoOfInvoices',
      'SupplierCategory', 'ToCPNumberB2B', 'TransactionRefNumber', 'CountryOfOrigin',
      'Brand', 'UnitOfMeasurement', 'UnitWeightSize', 'PackageUnitOfMeasurement',
      'UnitItemBarcode', 'FromCPNumberB2B', 'IsSupplier',
    ];

    const csvRows = [headers.join(',')];
    for (const row of data) {
      const values = headers.map((h) => {
        const val = row[h];
        if (val === null || val === undefined) return '';
        const str = String(val);
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      });
      csvRows.push(values.join(','));
    }

    await logAction('EXPORT', 'SupplierTransaction', null, { format: 'CSV', count: data.length }, req.user.id, req.ip);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=supplier_transactions_${Date.now()}.csv`);
    // Add BOM for Arabic support in Excel
    res.send('\uFEFF' + csvRows.join('\n'));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.apiEndpoint = async (req, res) => {
  try {
    const where = buildWhere(req.query);
    const data = await SupplierTransaction.findAll({ where, raw: true });
    const cleaned = data.map(({ id, createdAt, updatedAt, ...rest }) => rest);

    await logAction('API_ACCESS', 'SupplierTransaction', null, { count: cleaned.length }, req.user.id, req.ip);

    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      data: cleaned,
      count: cleaned.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
