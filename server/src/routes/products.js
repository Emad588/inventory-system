const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, productController.getAll);
router.get('/:id', authenticate, productController.getById);
router.post('/', authenticate, authorize('admin'), productController.create);
router.put('/:id', authenticate, authorize('admin'), productController.update);
router.delete('/:id', authenticate, authorize('admin'), productController.delete);

module.exports = router;
