const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const users = require('../controllers/userController');

router.use(authenticate, authorize('INVENTORY_MANAGER'));

router.get('/', users.listUsers);
router.post('/', users.createUser);
router.patch('/:id/toggle-active', users.toggleUserActive);
router.delete('/:id', users.deleteUser);

module.exports = router;
