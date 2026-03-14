const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const dashboard = require('../controllers/dashboardController');

router.get('/', authenticate, dashboard.getDashboard);

module.exports = router;
