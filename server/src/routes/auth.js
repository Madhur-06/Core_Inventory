const router = require('express').Router();
const auth = require('../controllers/authController');
const { validate, signupValidation, loginValidation } = require('../middleware/validation');

router.post('/login', validate(loginValidation), auth.login);
router.post('/refresh', auth.refreshToken);
router.post('/forgot-password', auth.forgotPassword);
router.post('/reset-password', auth.resetPassword);

module.exports = router;
