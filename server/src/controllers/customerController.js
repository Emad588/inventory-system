const { Customer } = require('../models');
const { Op } = require('sequelize');
const { logAction } = require('../utils/auditLogger');

exports.getAll = async (req, res) => {
  try {
    const { search, page = 1, limit = 20, isActive } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { nameAr: { [Op.like]: `%${search}%` } },
        { code: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { contactPerson: { [Op.like]: `%${search}%` } },
      ];
    }
    if (isActive !== undefined) {
      where.isActive = isActive === 'true' || isActive === true;
    }

    const { rows: customers, count: total } = await Customer.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      customers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
};

exports.getById = async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json({ customer });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, nameAr, code, email, phone, address, city, contactPerson, taxId, notes } = req.body;

    if (!name) return res.status(400).json({ error: 'Customer name is required' });
    if (!code) return res.status(400).json({ error: 'Customer code is required' });

    // Check if code already exists
    const existingCode = await Customer.findOne({ where: { code } });
    if (existingCode) return res.status(400).json({ error: 'Customer code already exists' });

    const customer = await Customer.create({
      name,
      nameAr,
      code,
      email,
      phone,
      address,
      city,
      contactPerson,
      taxId,
      notes,
      isActive: true,
    });

    await logAction('CREATE', 'Customer', customer.id, { code, name }, req.user.id, req.ip);
    res.status(201).json({ customer });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
};

exports.update = async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const { code } = req.body;

    // Check if new code already exists (and is different from current)
    if (code && code !== customer.code) {
      const existingCode = await Customer.findOne({ where: { code } });
      if (existingCode) return res.status(400).json({ error: 'Customer code already exists' });
    }

    await customer.update(req.body);

    await logAction('UPDATE', 'Customer', customer.id, req.body, req.user.id, req.ip);
    res.json({ customer });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
};

exports.delete = async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const code = customer.code;
    await customer.destroy();

    await logAction('DELETE', 'Customer', req.params.id, { code }, req.user.id, req.ip);
    res.json({ message: 'Customer deleted' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
};
