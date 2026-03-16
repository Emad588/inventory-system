const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/login', authController.login);
router.get('/profile', authenticate, authController.getProfile);
router.post('/register', authenticate, authorize('admin'), authController.register);
router.post('/users', authenticate, authorize('admin'), authController.register);
router.get('/users', authenticate, authorize('admin'), authController.getUsers);
router.put('/users/:id', authenticate, authorize('admin'), authController.updateUser);
router.delete('/users/:id', authenticate, authorize('admin'), authController.deleteUser);

module.exports = router;
