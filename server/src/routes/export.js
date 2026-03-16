const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
const { authenticate } = require('../middleware/auth');

router.get('/json', authenticate, exportController.exportJSON);
router.get('/csv', authenticate, exportController.exportCSV);
router.get('/api', authenticate, exportController.apiEndpoint);

module.exports = router;
