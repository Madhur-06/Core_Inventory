const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const analytics = require('../controllers/analyticsController');

router.use(authenticate);
router.get('/stock-movements', analytics.getStockMovementChart);
router.get('/valuation', analytics.getInventoryValuation);
router.get('/product-stock-history/:productId', analytics.getProductStockHistory);

module.exports = router;
