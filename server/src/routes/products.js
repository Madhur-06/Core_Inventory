const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const { validate, productValidation } = require('../middleware/validation');
const products = require('../controllers/productController');

router.use(authenticate);

router.get('/', products.getProducts);
router.get('/:id', products.getProduct);
router.get('/:id/stock', products.getProductStock);
router.post('/', validate(productValidation), products.createProduct);
router.put('/:id', products.updateProduct);
router.delete('/:id', authorize('INVENTORY_MANAGER'), products.deleteProduct);

module.exports = router;
