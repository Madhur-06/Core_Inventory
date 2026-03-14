const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const bulk = require('../controllers/bulkController');

router.use(authenticate);
router.post('/import-products', bulk.uploadMiddleware, bulk.bulkImportProducts);
router.post('/adjust-stock', bulk.bulkAdjustStock);

module.exports = router;
