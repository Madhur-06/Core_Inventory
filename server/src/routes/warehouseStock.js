const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const warehouseStock = require('../controllers/warehouseStockController');

router.use(authenticate);
router.get('/', warehouseStock.getWarehouseStock);

module.exports = router;
