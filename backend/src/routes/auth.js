const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile, updateDriverProfile } = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { registerValidation, loginValidation } = require('../validators/auth');

router.post('/register', validate(registerValidation), register);
router.post('/login', validate(loginValidation), login);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/driver-profile', authenticate, authorize('driver', 'both'), updateDriverProfile);

module.exports = router;
