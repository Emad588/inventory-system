const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, transactionController.getAll);
router.get('/:id', authenticate, transactionController.getById);
router.post('/', authenticate, transactionController.create);
router.put('/:id', authenticate, transactionController.update);
router.delete('/:id', authenticate, transactionController.delete);

module.exports = router;
