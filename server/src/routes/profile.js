const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const profile = require('../controllers/profileController');

router.use(authenticate);
router.get('/', profile.getProfile);
router.put('/', profile.updateProfile);

module.exports = router;
