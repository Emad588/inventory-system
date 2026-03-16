const { PurchaseOrder, PurchaseOrderItem, Supplier, Product, User } = require('../models');
const { Op } = require('sequelize');
const { logAction } = require('../utils/auditLogger');

// Generate next PO number
const generatePONumber = async () => {
  const year = new Date().getFullYear();
  const last = await PurchaseOrder.findOne({
    where: { poNumber: { [Op.like]: `PO-${year}-%` } },
    order: [['id', 'DESC']],
  });
  let seq = 1;
  if (last) {
    const parts = last.poNumber.split('-');
    seq = parseInt(parts[2], 10) + 1;
  }
  return `PO-${year}-${String(seq).padStart(5, '0')}`;
};

// Recalculate totals from items
const recalcTotals = (items, taxRate = 0) => {
  const subtotal = items.reduce((sum, item) => {
    const itemTotal = parseFloat(item.quantity) * parseFloat(item.unitPrice);
    return sum + itemTotal;
  }, 0);
  const taxAmount = subtotal * (parseFloat(taxRate) / 100);
  const totalAmount = subtotal + taxAmount;
  return {
    subtotal: Math.round(subtotal * 1000) / 1000,
    taxAmount: Math.round(taxAmount * 1000) / 1000,
    totalAmount: Math.round(totalAmount * 1000) / 1000,
  };
};

exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status, dateFrom, dateTo, supplierId } = req.query;
    const where = {};

    if (search) {
      where[Op.or] = [
        { poNumber: { [Op.like]: `%${search}%` } },
        { notes: { [Op.like]: `%${search}%` } },
      ];
    }
    if (status) where.status = status;
    if (supplierId) where.supplierId = parseInt(supplierId);
    if (dateFrom || dateTo) {
      where.purchaseDate = {};
      if (dateFrom) where.purchaseDate[Op.gte] = dateFrom;
      if (dateTo) where.purchaseDate[Op.lte] = dateTo;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await PurchaseOrder.findAndCountAll({
      where,
      include: [
        { model: Supplier, as: 'supplier', attributes: ['id', 'name', 'code'] },
        { model: PurchaseOrderItem, as: 'items' },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      purchaseOrders: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / parseInt(limit)),
    });
  } catch (error) {
    console.error('Get purchase orders error:', error);
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
};

exports.getById = async (req, res) => {
  try {
    const po = await PurchaseOrder.findByPk(req.params.id, {
      include: [
        { model: Supplier, as: 'supplier', attributes: ['id', 'name', 'code', 'email', 'phone'] },
        { model: PurchaseOrderItem, as: 'items', include: [{ model: Product, as: 'product' }] },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
      ],
    });
    if (!po) return res.status(404).json({ error: 'Purchase order not found' });
    res.json(po);
  } catch (error) {
    console.error('Get purchase order error:', error);
    res.status(500).json({ error: 'Failed to fetch purchase order' });
  }
};

exports.create = async (req, res) => {
  try {
    const {
      supplierId,
      purchaseDate,
      expectedDelivery,
      taxRate = 0,
      notes = '',
      items = [],
    } = req.body;

    if (!supplierId) return res.status(400).json({ error: 'Supplier ID is required' });
    if (!items.length) return res.status(400).json({ error: 'At least one item is required' });

    // Verify supplier exists
    const supplier = await Supplier.findByPk(supplierId);
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });

    const poNumber = await generatePONumber();
    const totals = recalcTotals(items, taxRate);

    const po = await PurchaseOrder.create({
      poNumber,
      supplierId,
      purchaseDate: purchaseDate || new Date().toISOString().split('T')[0],
      expectedDelivery,
      status: 'Ordered',
      subtotal: totals.subtotal,
      taxRate,
      taxAmount: totals.taxAmount,
      totalAmount: totals.totalAmount,
      notes,
      createdBy: req.user.id,
    });

    // Create purchase order items
    for (const item of items) {
      const itemTotal = parseFloat(item.quantity) * parseFloat(item.unitPrice);
      await PurchaseOrderItem.create({
        purchaseOrderId: po.id,
        productId: item.productId || null,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: Math.round(itemTotal * 1000) / 1000,
      });
    }

    // Fetch back with includes
    const result = await PurchaseOrder.findByPk(po.id, {
      include: [
        { model: Supplier, as: 'supplier' },
        { model: PurchaseOrderItem, as: 'items' },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
      ],
    });

    await logAction('CREATE', 'PurchaseOrder', po.id, { poNumber }, req.user.id, req.ip);
    res.status(201).json(result);
  } catch (error) {
    console.error('Create purchase order error:', error);
    res.status(500).json({ error: 'Failed to create purchase order' });
  }
};

exports.update = async (req, res) => {
  try {
    const po = await PurchaseOrder.findByPk(req.params.id);
    if (!po) return res.status(404).json({ error: 'Purchase order not found' });

    if (po.status === 'Cancelled') {
      return res.status(400).json({ error: 'Cannot modify a cancelled purchase order' });
    }

    const {
      supplierId,
      purchaseDate,
      expectedDelivery,
      receivedDate,
      status,
      taxRate,
      notes,
      items,
    } = req.body;

    // Update PO fields
    const updates = {};
    if (supplierId !== undefined) updates.supplierId = supplierId;
    if (purchaseDate !== undefined) updates.purchaseDate = purchaseDate;
    if (expectedDelivery !== undefined) updates.expectedDelivery = expectedDelivery;
    if (receivedDate !== undefined) updates.receivedDate = receivedDate;
    if (status !== undefined) updates.status = status;
    if (notes !== undefined) updates.notes = notes;

    // If items provided, replace them
    if (items && Array.isArray(items)) {
      await PurchaseOrderItem.destroy({ where: { purchaseOrderId: po.id } });
      for (const item of items) {
        const itemTotal = parseFloat(item.quantity) * parseFloat(item.unitPrice);
        await PurchaseOrderItem.create({
          purchaseOrderId: po.id,
          productId: item.productId || null,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: Math.round(itemTotal * 1000) / 1000,
        });
      }
      const totals = recalcTotals(items, taxRate ?? po.taxRate);
      updates.subtotal = totals.subtotal;
      updates.taxAmount = totals.taxAmount;
      updates.totalAmount = totals.totalAmount;
    }

    await po.update(updates);

    const result = await PurchaseOrder.findByPk(po.id, {
      include: [
        { model: Supplier, as: 'supplier' },
        { model: PurchaseOrderItem, as: 'items' },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
      ],
    });

    await logAction('UPDATE', 'PurchaseOrder', po.id, { poNumber: po.poNumber }, req.user.id, req.ip);
    res.json(result);
  } catch (error) {
    console.error('Update purchase order error:', error);
    res.status(500).json({ error: 'Failed to update purchase order' });
  }
};

exports.delete = async (req, res) => {
  try {
    const po = await PurchaseOrder.findByPk(req.params.id);
    if (!po) return res.status(404).json({ error: 'Purchase order not found' });

    if (po.status === 'Received' || po.status === 'Partially Received') {
      return res.status(400).json({ error: 'Cannot delete a received purchase order' });
    }

    const poNumber = po.poNumber;
    await PurchaseOrderItem.destroy({ where: { purchaseOrderId: po.id } });
    await po.destroy();

    await logAction('DELETE', 'PurchaseOrder', req.params.id, { poNumber }, req.user.id, req.ip);
    res.json({ message: 'Purchase order deleted' });
  } catch (error) {
    console.error('Delete purchase order error:', error);
    res.status(500).json({ error: 'Failed to delete purchase order' });
  }
};
