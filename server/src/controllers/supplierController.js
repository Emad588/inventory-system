const { Supplier } = require('../models');
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

    const { rows: suppliers, count: total } = await Supplier.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      suppliers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
};

exports.getById = async (req, res) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
    res.json({ supplier });
  } catch (error) {
    console.error('Get supplier error:', error);
    res.status(500).json({ error: 'Failed to fetch supplier' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, nameAr, code, email, phone, address, city, contactPerson, taxId, notes } = req.body;

    if (!name) return res.status(400).json({ error: 'Supplier name is required' });
    if (!code) return res.status(400).json({ error: 'Supplier code is required' });

    // Check if code already exists
    const existingCode = await Supplier.findOne({ where: { code } });
    if (existingCode) return res.status(400).json({ error: 'Supplier code already exists' });

    const supplier = await Supplier.create({
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

    await logAction('CREATE', 'Supplier', supplier.id, { code, name }, req.user.id, req.ip);
    res.status(201).json({ supplier });
  } catch (error) {
    console.error('Create supplier error:', error);
    res.status(500).json({ error: 'Failed to create supplier' });
  }
};

exports.update = async (req, res) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });

    const { code } = req.body;

    // Check if new code already exists (and is different from current)
    if (code && code !== supplier.code) {
      const existingCode = await Supplier.findOne({ where: { code } });
      if (existingCode) return res.status(400).json({ error: 'Supplier code already exists' });
    }

    await supplier.update(req.body);

    await logAction('UPDATE', 'Supplier', supplier.id, req.body, req.user.id, req.ip);
    res.json({ supplier });
  } catch (error) {
    console.error('Update supplier error:', error);
    res.status(500).json({ error: 'Failed to update supplier' });
  }
};

exports.delete = async (req, res) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });

    const code = supplier.code;
    await supplier.destroy();

    await logAction('DELETE', 'Supplier', req.params.id, { code }, req.user.id, req.ip);
    res.json({ message: 'Supplier deleted' });
  } catch (error) {
    console.error('Delete supplier error:', error);
    res.status(500).json({ error: 'Failed to delete supplier' });
  }
};
