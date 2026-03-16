const router = require('express').Router();
const billingController = require('../controllers/billingController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/summary', billingController.summary);
router.get('/', billingController.getAll);
router.get('/:id', billingController.getById);
router.post('/', billingController.create);
router.put('/:id', billingController.update);
router.delete('/:id', authorize('admin'), billingController.delete);
router.post('/:id/pay', billingController.markPaid);

module.exports = router;
