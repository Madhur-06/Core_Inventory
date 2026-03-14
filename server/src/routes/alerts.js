const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const alerts = require('../controllers/alertController');

router.use(authenticate);
router.get('/', alerts.getAlerts);

module.exports = router;
