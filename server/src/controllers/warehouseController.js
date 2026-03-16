const { Warehouse } = require('../models');
const { Op } = require('sequelize');
const { logAction } = require('../utils/auditLogger');

exports.getAll = async (req, res) => {
  try {
    const { search } = req.query;
    const where = {};
    if (search) {
      where[Op.or] = [
        { warehouseNumber: { [Op.like]: `%${search}%` } },
        { warehouseName: { [Op.like]: `%${search}%` } },
        { location: { [Op.like]: `%${search}%` } },
      ];
    }

    const warehouses = await Warehouse.findAll({ where, order: [['createdAt', 'DESC']] });
    res.json({ warehouses });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const warehouse = await Warehouse.findByPk(req.params.id);
    if (!warehouse) return res.status(404).json({ error: 'Warehouse not found' });
    res.json({ warehouse });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const warehouse = await Warehouse.create(req.body);
    await logAction('CREATE', 'Warehouse', warehouse.id, req.body, req.user.id, req.ip);
    res.status(201).json({ warehouse });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const warehouse = await Warehouse.findByPk(req.params.id);
    if (!warehouse) return res.status(404).json({ error: 'Warehouse not found' });

    await warehouse.update(req.body);
    await logAction('UPDATE', 'Warehouse', warehouse.id, req.body, req.user.id, req.ip);
    res.json({ warehouse });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const warehouse = await Warehouse.findByPk(req.params.id);
    if (!warehouse) return res.status(404).json({ error: 'Warehouse not found' });

    await warehouse.destroy();
    await logAction('DELETE', 'Warehouse', req.params.id, {}, req.user.id, req.ip);
    res.json({ message: 'Warehouse deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
