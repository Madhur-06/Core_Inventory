const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const moveHistory = require('../controllers/moveHistoryController');

router.use(authenticate);
router.get('/', moveHistory.getMoveHistory);

module.exports = router;
