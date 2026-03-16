const router = require('express').Router();
const purchaseController = require('../controllers/purchaseController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', purchaseController.getAll);
router.get('/:id', purchaseController.getById);
router.post('/', purchaseController.create);
router.put('/:id', purchaseController.update);
router.delete('/:id', authorize('admin'), purchaseController.delete);

module.exports = router;
