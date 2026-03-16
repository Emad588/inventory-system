const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouseController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, warehouseController.getAll);
router.get('/:id', authenticate, warehouseController.getById);
router.post('/', authenticate, authorize('admin'), warehouseController.create);
router.put('/:id', authenticate, authorize('admin'), warehouseController.update);
router.delete('/:id', authenticate, authorize('admin'), warehouseController.delete);

module.exports = router;
