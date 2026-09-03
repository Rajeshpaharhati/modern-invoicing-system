const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const { validateAuthInput } = require('../middleware/validation');

router.post('/register', validateAuthInput, authController.register);
router.post('/login', validateAuthInput, authController.login);
router.get('/me', auth, authController.getMe);

module.exports = router;
