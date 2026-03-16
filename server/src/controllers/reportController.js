const { Invoice, Transaction, Warehouse, sequelize } = require('../models');
const { Op } = require('sequelize');
const Sequelize = require('sequelize');

exports.billingReport = async (req, res) => {
  try {
    const { dateFrom, dateTo, groupBy = 'month' } = req.query;

    const where = {};
    if (dateFrom || dateTo) {
      where.invoiceDate = {};
      if (dateFrom) where.invoiceDate[Op.gte] = dateFrom;
      if (dateTo) where.invoiceDate[Op.lte] = dateTo;
    }

    // Revenue by status (Paid, Draft, Sent, Overdue)
    const invoicesByStatus = await Invoice.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalAmount'],
      ],
      where,
      group: ['status'],
      raw: true,
    });

    // Revenue by month
    const revenueByMonth = await Invoice.findAll({
      attributes: [
        [sequelize.fn('strftime', '%Y-%m', sequelize.col('invoiceDate')), 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalAmount'],
      ],
      where: { status: 'Paid', ...where },
      group: [sequelize.fn('strftime', '%Y-%m', sequelize.col('invoiceDate'))],
      order: [[sequelize.fn('strftime', '%Y-%m', sequelize.col('invoiceDate')), 'ASC']],
      raw: true,
    });

    // Top customers
    const topCustomers = await Invoice.findAll({
      attributes: [
        'customerName',
        [sequelize.fn('COUNT', sequelize.col('id')), 'invoiceCount'],
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalAmount'],
      ],
      where: { status: 'Paid', ...where },
      group: ['customerName'],
      order: [[sequelize.fn('SUM', sequelize.col('totalAmount')), 'DESC']],
      limit: 10,
      raw: true,
    });

    res.json({
      invoicesByStatus: invoicesByStatus.map(item => ({
        status: item.status,
        count: parseInt(item.count),
        totalAmount: Math.round(parseFloat(item.totalAmount || 0) * 1000) / 1000,
      })),
      revenueByMonth: revenueByMonth.map(item => ({
        month: item.month,
        count: parseInt(item.count),
        totalAmount: Math.round(parseFloat(item.totalAmount || 0) * 1000) / 1000,
      })),
      topCustomers: topCustomers.map(item => ({
        customerName: item.customerName,
        invoiceCount: parseInt(item.invoiceCount),
        totalAmount: Math.round(parseFloat(item.totalAmount || 0) * 1000) / 1000,
      })),
    });
  } catch (error) {
    console.error('Billing report error:', error);
    res.status(500).json({ error: 'Failed to generate billing report' });
  }
};

exports.transactionReport = async (req, res) => {
  try {
    const { dateFrom, dateTo, warehouseId } = req.query;

    const where = {};
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt[Op.gte] = dateFrom;
      if (dateTo) where.createdAt[Op.lte] = dateTo;
    }
    if (warehouseId) where.warehouseId = parseInt(warehouseId);

    // Transactions by type
    const byType = await Transaction.findAll({
      attributes: [
        'transactionType',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity'],
      ],
      where,
      group: ['transactionType'],
      raw: true,
    });

    // Transactions by warehouse
    const byWarehouse = await Transaction.findAll({
      attributes: [
        [sequelize.col('Warehouse.warehouseName'), 'warehouseName'],
        [sequelize.fn('COUNT', sequelize.col('Transaction.id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity'],
      ],
      include: [{ model: Warehouse, attributes: [], required: true }],
      where,
      group: [sequelize.col('Warehouse.id')],
      raw: true,
    });

    // Daily transaction counts
    const dailyCounts = await Transaction.findAll({
      attributes: [
        [sequelize.fn('strftime', '%Y-%m-%d', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      where,
      group: [sequelize.fn('strftime', '%Y-%m-%d', sequelize.col('createdAt'))],
      order: [[sequelize.fn('strftime', '%Y-%m-%d', sequelize.col('createdAt')), 'DESC']],
      limit: 30,
      raw: true,
    });

    res.json({
      byType: byType.map(item => ({
        transactionType: item.transactionType,
        count: parseInt(item.count),
        totalQuantity: Math.round(parseFloat(item.totalQuantity || 0) * 1000) / 1000,
      })),
      byWarehouse: byWarehouse.map(item => ({
        warehouseName: item.warehouseName,
        count: parseInt(item.count),
        totalQuantity: Math.round(parseFloat(item.totalQuantity || 0) * 1000) / 1000,
      })),
      dailyCounts: dailyCounts.map(item => ({
        date: item.date,
        count: parseInt(item.count),
      })),
    });
  } catch (error) {
    console.error('Transaction report error:', error);
    res.status(500).json({ error: 'Failed to generate transaction report' });
  }
};
