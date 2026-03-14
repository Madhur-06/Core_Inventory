const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const activityLog = require('../controllers/activityLogController');

router.use(authenticate);
router.get('/', activityLog.getActivityLogs);

module.exports = router;
