const router = require('express').Router();
const reportController = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/billing', reportController.billingReport);
router.get('/transactions', reportController.transactionReport);

module.exports = router;
