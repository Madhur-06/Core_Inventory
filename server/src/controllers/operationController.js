const prisma = require('../utils/prisma');
const { generateReferenceNumber } = require('../utils/helpers');
const { logActivity } = require('../utils/activityLogger');

// Get operations with filters
exports.getOperations = async (req, res, next) => {
  try {
    const { type, status, warehouseId, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (warehouseId) {
      where.OR = [
        { sourceLocation: { warehouseId } },
        { destinationLocation: { warehouseId } },
      ];
    }

    const [operations, total] = await Promise.all([
      prisma.stockOperation.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          creator: { select: { name: true } },
          sourceLocation: { include: { warehouse: { select: { name: true } } } },
          destinationLocation: { include: { warehouse: { select: { name: true } } } },
          lines: { include: { product: { select: { name: true, sku: true } } } },
          _count: { select: { lines: true } },
        },
      }),
      prisma.stockOperation.count({ where }),
    ]);

    res.json({ operations, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
};

exports.getOperation = async (req, res, next) => {
  try {
    const operation = await prisma.stockOperation.findUnique({
      where: { id: req.params.id },
      include: {
        creator: { select: { name: true, email: true } },
        sourceLocation: { include: { warehouse: true } },
        destinationLocation: { include: { warehouse: true } },
        lines: { include: { product: true } },
      },
    });
    if (!operation) return res.status(404).json({ error: 'Operation not found' });
    res.json(operation);
  } catch (err) {
    next(err);
  }
};

// Create Receipt
exports.createReceipt = async (req, res, next) => {
  try {
    const { supplierName, destinationLocationId, notes, lines } = req.body;

    const operation = await prisma.stockOperation.create({
      data: {
        type: 'RECEIPT',
        referenceNumber: generateReferenceNumber('REC'),
        supplierName,
        destinationLocationId,
        notes,
        createdBy: req.user.id,
        lines: {
          create: lines.map((l) => ({
            productId: l.productId,
            expectedQty: l.expectedQty,
          })),
        },
      },
      include: { lines: { include: { product: true } }, destinationLocation: true },
    });

    res.status(201).json(operation);
  } catch (err) {
    next(err);
  }
};

// Create Delivery
exports.createDelivery = async (req, res, next) => {
  try {
    const { customerName, sourceLocationId, notes, lines } = req.body;

    const operation = await prisma.stockOperation.create({
      data: {
        type: 'DELIVERY',
        referenceNumber: generateReferenceNumber('DEL'),
        customerName,
        sourceLocationId,
        notes,
        createdBy: req.user.id,
        lines: {
          create: lines.map((l) => ({
            productId: l.productId,
            expectedQty: l.expectedQty,
          })),
        },
      },
      include: { lines: { include: { product: true } }, sourceLocation: true },
    });

    res.status(201).json(operation);
  } catch (err) {
    next(err);
  }
};

// Create Transfer
exports.createTransfer = async (req, res, next) => {
  try {
    const { sourceLocationId, destinationLocationId, notes, lines } = req.body;

    if (sourceLocationId === destinationLocationId) {
      return res.status(400).json({ error: 'Source and destination must be different' });
    }

    const operation = await prisma.stockOperation.create({
      data: {
        type: 'TRANSFER',
        referenceNumber: generateReferenceNumber('TRF'),
        sourceLocationId,
        destinationLocationId,
        notes,
        createdBy: req.user.id,
        lines: {
          create: lines.map((l) => ({
            productId: l.productId,
            expectedQty: l.expectedQty,
          })),
        },
      },
      include: {
        lines: { include: { product: true } },
        sourceLocation: { include: { warehouse: true } },
        destinationLocation: { include: { warehouse: true } },
      },
    });

    res.status(201).json(operation);
  } catch (err) {
    next(err);
  }
};

// Create Adjustment
exports.createAdjustment = async (req, res, next) => {
  try {
    const { sourceLocationId, notes, lines } = req.body;

    const operation = await prisma.stockOperation.create({
      data: {
        type: 'ADJUSTMENT',
        referenceNumber: generateReferenceNumber('ADJ'),
        sourceLocationId,
        notes,
        createdBy: req.user.id,
        lines: {
          create: lines.map((l) => ({
            productId: l.productId,
            expectedQty: l.expectedQty, // recorded qty
            actualQty: l.actualQty,     // counted qty
          })),
        },
      },
      include: { lines: { include: { product: true } }, sourceLocation: true },
    });

    res.status(201).json(operation);
  } catch (err) {
    next(err);
  }
};

// Update operation (add/remove lines, change fields)
exports.updateOperation = async (req, res, next) => {
  try {
    const op = await prisma.stockOperation.findUnique({ where: { id: req.params.id } });
    if (!op) return res.status(404).json({ error: 'Operation not found' });
    if (op.status === 'DONE' || op.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Cannot modify a completed or cancelled operation' });
    }

    const { supplierName, customerName, notes, status, lines } = req.body;

    const updateData = {
      ...(supplierName !== undefined && { supplierName }),
      ...(customerName !== undefined && { customerName }),
      ...(notes !== undefined && { notes }),
      ...(status !== undefined && { status }),
    };

    if (lines) {
      await prisma.stockOperationLine.deleteMany({ where: { operationId: op.id } });
      await prisma.stockOperationLine.createMany({
        data: lines.map((l) => ({
          operationId: op.id,
          productId: l.productId,
          expectedQty: l.expectedQty,
          actualQty: l.actualQty || null,
        })),
      });
    }

    const updated = await prisma.stockOperation.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        lines: { include: { product: true } },
        sourceLocation: { include: { warehouse: true } },
        destinationLocation: { include: { warehouse: true } },
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// Validate (complete) an operation — this is the core stock update logic
exports.validateOperation = async (req, res, next) => {
  try {
    const op = await prisma.stockOperation.findUnique({
      where: { id: req.params.id },
      include: {
        lines: { include: { product: { select: { name: true, sku: true } } } },
        sourceLocation: { include: { warehouse: { select: { name: true } } } },
      },
    });

    if (!op) return res.status(404).json({ error: 'Operation not found' });
    if (op.status === 'DONE') return res.status(400).json({ error: 'Already validated' });
    if (op.status === 'CANCELLED') return res.status(400).json({ error: 'Operation is cancelled' });

    const { actualQuantities } = req.body; // optional: { lineId: actualQty }

    await prisma.$transaction(async (tx) => {
      for (const line of op.lines) {
        const qty = actualQuantities?.[line.id] ?? line.actualQty ?? line.expectedQty;

        // Update actual qty on line
        await tx.stockOperationLine.update({
          where: { id: line.id },
          data: { actualQty: qty },
        });

        if (op.type === 'RECEIPT') {
          // Increase stock at destination
          const stockLevel = await tx.stockLevel.upsert({
            where: { productId_locationId: { productId: line.productId, locationId: op.destinationLocationId } },
            create: { productId: line.productId, locationId: op.destinationLocationId, quantity: qty },
            update: { quantity: { increment: qty } },
          });

          await tx.moveHistory.create({
            data: {
              productId: line.productId,
              locationId: op.destinationLocationId,
              operationId: op.id,
              quantityChange: qty,
              balanceAfter: stockLevel.quantity,
              moveType: 'IN',
              createdBy: req.user.id,
            },
          });
        } else if (op.type === 'DELIVERY') {
          // Check stock availability — reads CURRENT stock from DB
          const current = await tx.stockLevel.findUnique({
            where: { productId_locationId: { productId: line.productId, locationId: op.sourceLocationId } },
          });

          if (!current || current.quantity < qty) {
            const productName = line.product?.name || line.productId;
            const locationName = op.sourceLocation ? `${op.sourceLocation.warehouse?.name} / ${op.sourceLocation.name}` : op.sourceLocationId;
            throw new Error(`Insufficient stock for "${productName}" at ${locationName}. Available: ${current?.quantity || 0}, Required: ${qty}`);
          }

          const stockLevel = await tx.stockLevel.update({
            where: { productId_locationId: { productId: line.productId, locationId: op.sourceLocationId } },
            data: { quantity: { decrement: qty } },
          });

          await tx.moveHistory.create({
            data: {
              productId: line.productId,
              locationId: op.sourceLocationId,
              operationId: op.id,
              quantityChange: -qty,
              balanceAfter: stockLevel.quantity,
              moveType: 'OUT',
              createdBy: req.user.id,
            },
          });
        } else if (op.type === 'TRANSFER') {
          // Decrease source
          const sourceCurrent = await tx.stockLevel.findUnique({
            where: { productId_locationId: { productId: line.productId, locationId: op.sourceLocationId } },
          });

          if (!sourceCurrent || sourceCurrent.quantity < qty) {
            const productName = line.product?.name || line.productId;
            const locationName = op.sourceLocation ? `${op.sourceLocation.warehouse?.name} / ${op.sourceLocation.name}` : op.sourceLocationId;
            throw new Error(`Insufficient stock for "${productName}" at ${locationName}. Available: ${sourceCurrent?.quantity || 0}, Required: ${qty}`);
          }

          const sourceLevel = await tx.stockLevel.update({
            where: { productId_locationId: { productId: line.productId, locationId: op.sourceLocationId } },
            data: { quantity: { decrement: qty } },
          });

          // Increase destination
          const destLevel = await tx.stockLevel.upsert({
            where: { productId_locationId: { productId: line.productId, locationId: op.destinationLocationId } },
            create: { productId: line.productId, locationId: op.destinationLocationId, quantity: qty },
            update: { quantity: { increment: qty } },
          });

          await tx.moveHistory.createMany({
            data: [
              {
                productId: line.productId,
                locationId: op.sourceLocationId,
                operationId: op.id,
                quantityChange: -qty,
                balanceAfter: sourceLevel.quantity,
                moveType: 'TRANSFER_OUT',
                createdBy: req.user.id,
              },
              {
                productId: line.productId,
                locationId: op.destinationLocationId,
                operationId: op.id,
                quantityChange: qty,
                balanceAfter: destLevel.quantity,
                moveType: 'TRANSFER_IN',
                createdBy: req.user.id,
              },
            ],
          });
        } else if (op.type === 'ADJUSTMENT') {
          const recorded = line.expectedQty;
          const counted = qty;
          const diff = counted - recorded;

          const stockLevel = await tx.stockLevel.upsert({
            where: { productId_locationId: { productId: line.productId, locationId: op.sourceLocationId } },
            create: { productId: line.productId, locationId: op.sourceLocationId, quantity: counted },
            update: { quantity: counted },
          });

          await tx.moveHistory.create({
            data: {
              productId: line.productId,
              locationId: op.sourceLocationId,
              operationId: op.id,
              quantityChange: diff,
              balanceAfter: stockLevel.quantity,
              moveType: 'ADJUSTMENT',
              createdBy: req.user.id,
            },
          });
        }
      }

      // Mark operation as done
      await tx.stockOperation.update({
        where: { id: op.id },
        data: { status: 'DONE', validatedAt: new Date() },
      });
    });

    const validated = await prisma.stockOperation.findUnique({
      where: { id: op.id },
      include: {
        lines: { include: { product: true } },
        sourceLocation: { include: { warehouse: true } },
        destinationLocation: { include: { warehouse: true } },
      },
    });

    await logActivity(req.user.id, 'VALIDATE', 'StockOperation', op.id, `Validated ${op.type}: ${op.referenceNumber}`);

    res.json(validated);
  } catch (err) {
    if (err.message?.includes('Insufficient stock')) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
};

// Cancel operation
exports.cancelOperation = async (req, res, next) => {
  try {
    const op = await prisma.stockOperation.findUnique({ where: { id: req.params.id } });
    if (!op) return res.status(404).json({ error: 'Operation not found' });
    if (op.status === 'DONE') return res.status(400).json({ error: 'Cannot cancel a completed operation' });

    const updated = await prisma.stockOperation.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};
