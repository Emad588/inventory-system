const { Invoice, InvoiceItem, Product, User, Transaction } = require('../models');
const { Op } = require('sequelize');
const { logAction } = require('../utils/auditLogger');

// Generate next invoice number
const generateInvoiceNumber = async () => {
  const year = new Date().getFullYear();
  const last = await Invoice.findOne({
    where: { invoiceNumber: { [Op.like]: `INV-${year}-%` } },
    order: [['id', 'DESC']],
  });
  let seq = 1;
  if (last) {
    const parts = last.invoiceNumber.split('-');
    seq = parseInt(parts[2], 10) + 1;
  }
  return `INV-${year}-${String(seq).padStart(5, '0')}`;
};

// Recalculate totals from items
const recalcTotals = (items, taxRate = 0, invoiceDiscount = 0) => {
  const subtotal = items.reduce((sum, item) => {
    const itemTotal = (parseFloat(item.quantity) * parseFloat(item.unitPrice)) - parseFloat(item.discount || 0);
    return sum + itemTotal;
  }, 0);
  const taxAmount = subtotal * (parseFloat(taxRate) / 100);
  const totalAmount = subtotal + taxAmount - parseFloat(invoiceDiscount);
  return {
    subtotal: Math.round(subtotal * 1000) / 1000,
    taxAmount: Math.round(taxAmount * 1000) / 1000,
    totalAmount: Math.round(totalAmount * 1000) / 1000,
  };
};

exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status, dateFrom, dateTo } = req.query;
    const where = {};

    if (search) {
      where[Op.or] = [
        { invoiceNumber: { [Op.like]: `%${search}%` } },
        { customerName: { [Op.like]: `%${search}%` } },
        { customerNameAr: { [Op.like]: `%${search}%` } },
        { customerEmail: { [Op.like]: `%${search}%` } },
      ];
    }
    if (status) where.status = status;
    if (dateFrom || dateTo) {
      where.invoiceDate = {};
      if (dateFrom) where.invoiceDate[Op.gte] = dateFrom;
      if (dateTo) where.invoiceDate[Op.lte] = dateTo;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Invoice.findAndCountAll({
      where,
      include: [
        { model: InvoiceItem, as: 'items' },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      invoices: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / parseInt(limit)),
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
};

exports.getById = async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id, {
      include: [
        { model: InvoiceItem, as: 'items', include: [{ model: Product, as: 'product' }] },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
      ],
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
};

exports.create = async (req, res) => {
  try {
    const {
      customerName, customerNameAr, customerEmail, customerPhone,
      customerAddress, customerTaxId, invoiceDate, dueDate,
      taxRate = 0, discount = 0, currency = 'QAR',
      paymentMethod, notes, notesAr, transactionId, items = [],
    } = req.body;

    if (!customerName) return res.status(400).json({ error: 'Customer name is required' });
    if (!items.length) return res.status(400).json({ error: 'At least one item is required' });

    const invoiceNumber = await generateInvoiceNumber();
    const totals = recalcTotals(items, taxRate, discount);

    const invoice = await Invoice.create({
      invoiceNumber,
      invoiceDate: invoiceDate || new Date().toISOString().split('T')[0],
      dueDate,
      customerName, customerNameAr, customerEmail, customerPhone,
      customerAddress, customerTaxId,
      subtotal: totals.subtotal,
      taxRate,
      taxAmount: totals.taxAmount,
      discount,
      totalAmount: totals.totalAmount,
      currency,
      paymentMethod,
      notes, notesAr,
      transactionId,
      createdBy: req.user.id,
    });

    // Create invoice items
    for (const item of items) {
      const itemTotal = (parseFloat(item.quantity) * parseFloat(item.unitPrice)) - parseFloat(item.discount || 0);
      await InvoiceItem.create({
        invoiceId: invoice.id,
        productId: item.productId || null,
        description: item.description,
        descriptionAr: item.descriptionAr || null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
        total: Math.round(itemTotal * 1000) / 1000,
        barcode: item.barcode || null,
        hsCode: item.hsCode || null,
      });
    }

    // Fetch back with includes
    const result = await Invoice.findByPk(invoice.id, {
      include: [{ model: InvoiceItem, as: 'items' }],
    });

    await logAction(req.user.id, 'CREATE', 'Invoice', invoice.id, { invoiceNumber });
    res.status(201).json(result);
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
};

exports.update = async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    if (invoice.status === 'Paid') {
      return res.status(400).json({ error: 'Cannot modify a paid invoice' });
    }

    const {
      customerName, customerNameAr, customerEmail, customerPhone,
      customerAddress, customerTaxId, invoiceDate, dueDate, status,
      taxRate, discount, currency, paymentMethod, paymentDate,
      notes, notesAr, items,
    } = req.body;

    // Update invoice fields
    const updates = {};
    if (customerName !== undefined) updates.customerName = customerName;
    if (customerNameAr !== undefined) updates.customerNameAr = customerNameAr;
    if (customerEmail !== undefined) updates.customerEmail = customerEmail;
    if (customerPhone !== undefined) updates.customerPhone = customerPhone;
    if (customerAddress !== undefined) updates.customerAddress = customerAddress;
    if (customerTaxId !== undefined) updates.customerTaxId = customerTaxId;
    if (invoiceDate !== undefined) updates.invoiceDate = invoiceDate;
    if (dueDate !== undefined) updates.dueDate = dueDate;
    if (status !== undefined) updates.status = status;
    if (taxRate !== undefined) updates.taxRate = taxRate;
    if (discount !== undefined) updates.discount = discount;
    if (currency !== undefined) updates.currency = currency;
    if (paymentMethod !== undefined) updates.paymentMethod = paymentMethod;
    if (paymentDate !== undefined) updates.paymentDate = paymentDate;
    if (notes !== undefined) updates.notes = notes;
    if (notesAr !== undefined) updates.notesAr = notesAr;

    // If items provided, replace them
    if (items && Array.isArray(items)) {
      await InvoiceItem.destroy({ where: { invoiceId: invoice.id } });
      for (const item of items) {
        const itemTotal = (parseFloat(item.quantity) * parseFloat(item.unitPrice)) - parseFloat(item.discount || 0);
        await InvoiceItem.create({
          invoiceId: invoice.id,
          productId: item.productId || null,
          description: item.description,
          descriptionAr: item.descriptionAr || null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount || 0,
          total: Math.round(itemTotal * 1000) / 1000,
          barcode: item.barcode || null,
          hsCode: item.hsCode || null,
        });
      }
      const totals = recalcTotals(items, taxRate ?? invoice.taxRate, discount ?? invoice.discount);
      updates.subtotal = totals.subtotal;
      updates.taxAmount = totals.taxAmount;
      updates.totalAmount = totals.totalAmount;
    }

    await invoice.update(updates);

    const result = await Invoice.findByPk(invoice.id, {
      include: [{ model: InvoiceItem, as: 'items' }],
    });

    await logAction(req.user.id, 'UPDATE', 'Invoice', invoice.id, { invoiceNumber: invoice.invoiceNumber });
    res.json(result);
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({ error: 'Failed to update invoice' });
  }
};

exports.delete = async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    if (invoice.status === 'Paid') {
      return res.status(400).json({ error: 'Cannot delete a paid invoice' });
    }

    await InvoiceItem.destroy({ where: { invoiceId: invoice.id } });
    await invoice.destroy();

    await logAction(req.user.id, 'DELETE', 'Invoice', invoice.id, { invoiceNumber: invoice.invoiceNumber });
    res.json({ message: 'Invoice deleted' });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
};

// Mark invoice as paid
exports.markPaid = async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    await invoice.update({
      status: 'Paid',
      paymentDate: req.body.paymentDate || new Date().toISOString().split('T')[0],
      paymentMethod: req.body.paymentMethod || invoice.paymentMethod,
    });

    await logAction(req.user.id, 'UPDATE', 'Invoice', invoice.id, { action: 'markPaid', invoiceNumber: invoice.invoiceNumber });
    res.json(invoice);
  } catch (error) {
    console.error('Mark paid error:', error);
    res.status(500).json({ error: 'Failed to update invoice' });
  }
};

// Get billing summary / stats
exports.summary = async (req, res) => {
  try {
    const totalInvoices = await Invoice.count();
    const paidInvoices = await Invoice.count({ where: { status: 'Paid' } });
    const pendingInvoices = await Invoice.count({ where: { status: { [Op.in]: ['Draft', 'Sent'] } } });
    const overdueInvoices = await Invoice.count({ where: { status: 'Overdue' } });

    // Sum totals by status
    const allInvoices = await Invoice.findAll({ attributes: ['status', 'totalAmount'] });
    let totalRevenue = 0, totalPending = 0, totalOverdue = 0;
    allInvoices.forEach(inv => {
      const amt = parseFloat(inv.totalAmount) || 0;
      if (inv.status === 'Paid') totalRevenue += amt;
      else if (inv.status === 'Draft' || inv.status === 'Sent') totalPending += amt;
      else if (inv.status === 'Overdue') totalOverdue += amt;
    });

    res.json({
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
      totalRevenue: Math.round(totalRevenue * 1000) / 1000,
      totalPending: Math.round(totalPending * 1000) / 1000,
      totalOverdue: Math.round(totalOverdue * 1000) / 1000,
    });
  } catch (error) {
    console.error('Billing summary error:', error);
    res.status(500).json({ error: 'Failed to fetch billing summary' });
  }
};
