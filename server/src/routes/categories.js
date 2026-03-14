const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const categories = require('../controllers/categoryController');

router.use(authenticate);

router.get('/', categories.getCategories);
router.post('/', authorize('INVENTORY_MANAGER'), categories.createCategory);
router.put('/:id', authorize('INVENTORY_MANAGER'), categories.updateCategory);
router.delete('/:id', authorize('INVENTORY_MANAGER'), categories.deleteCategory);

module.exports = router;
