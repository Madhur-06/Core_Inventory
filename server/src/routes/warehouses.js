const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const warehouses = require('../controllers/warehouseController');

router.use(authenticate);

router.get('/', warehouses.getWarehouses);
router.get('/:id', warehouses.getWarehouse);
router.post('/', authorize('INVENTORY_MANAGER'), warehouses.createWarehouse);
router.put('/:id', authorize('INVENTORY_MANAGER'), warehouses.updateWarehouse);
router.delete('/:id', authorize('INVENTORY_MANAGER'), warehouses.deleteWarehouse);

// Locations
router.post('/:id/locations', authorize('INVENTORY_MANAGER'), warehouses.createLocation);
router.put('/:id/locations/:locationId', authorize('INVENTORY_MANAGER'), warehouses.updateLocation);
router.delete('/:id/locations/:locationId', authorize('INVENTORY_MANAGER'), warehouses.deleteLocation);

module.exports = router;
