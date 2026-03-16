const { Product, Transaction, Warehouse, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.getSummary = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalProducts, totalWarehouses, totalTransactions, todayTransactions, recentTransactions] =
      await Promise.all([
        Product.count(),
        Warehouse.count(),
        Transaction.count(),
        Transaction.count({
          where: { transactionDatetime: { [Op.gte]: today } },
        }),
        Transaction.findAll({
          include: [
            { model: Product, attributes: ['productNameEn', 'productNameAr'] },
            { model: Warehouse, attributes: ['warehouseNumber', 'warehouseName'] },
          ],
          order: [['transactionDatetime', 'DESC']],
          limit: 10,
        }),
      ]);

    // Warehouse summary with transaction counts
    const warehouseSummary = await Warehouse.findAll({
      attributes: [
        'id',
        'warehouseNumber',
        'warehouseName',
        'location',
        [sequelize.fn('COUNT', sequelize.col('Transactions.id')), 'transactionCount'],
      ],
      include: [{
        model: Transaction,
        attributes: [],
      }],
      group: ['Warehouse.id'],
      raw: true,
    });

    // Transaction type breakdown
    const typeBreakdown = await Transaction.findAll({
      attributes: [
        'transactionType',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity'],
      ],
      group: ['transactionType'],
      raw: true,
    });

    res.json({
      totalProducts,
      totalWarehouses,
      totalTransactions,
      todayTransactions,
      recentTransactions,
      warehouseSummary,
      typeBreakdown,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
