const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const { validate, operationLineValidation } = require('../middleware/validation');
const ops = require('../controllers/operationController');

router.use(authenticate);

router.get('/', ops.getOperations);
router.get('/:id', ops.getOperation);

router.post('/receipts', authorize('INVENTORY_MANAGER'), validate(operationLineValidation), ops.createReceipt);
router.post('/deliveries', authorize('INVENTORY_MANAGER'), validate(operationLineValidation), ops.createDelivery);
router.post('/transfers', validate(operationLineValidation), ops.createTransfer);
router.post('/adjustments', validate(operationLineValidation), ops.createAdjustment);

router.put('/:id', ops.updateOperation);
router.post('/:id/validate', ops.validateOperation);
router.post('/:id/cancel', ops.cancelOperation);

module.exports = router;
