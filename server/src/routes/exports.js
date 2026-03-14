const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const exports_ = require('../controllers/exportController');

router.use(authenticate);
router.get('/products', exports_.exportProducts);
router.get('/operations', exports_.exportOperations);
router.get('/move-history', exports_.exportMoveHistory);
router.get('/stock-report', exports_.exportStockReport);
router.get('/monthly-report', exports_.exportMonthlyReport);

module.exports = router;
