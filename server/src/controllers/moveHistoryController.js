const prisma = require('../utils/prisma');

exports.getMoveHistory = async (req, res, next) => {
  try {
    const { productId, locationId, moveType, startDate, endDate, page = 1, limit = 30 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (productId) where.productId = productId;
    if (locationId) where.locationId = locationId;
    if (moveType) where.moveType = moveType;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    const [moves, total] = await Promise.all([
      prisma.moveHistory.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { timestamp: 'desc' },
        include: {
          product: { select: { name: true, sku: true } },
          location: { include: { warehouse: { select: { name: true } } } },
          operation: { select: { referenceNumber: true, type: true } },
          creator: { select: { name: true } },
        },
      }),
      prisma.moveHistory.count({ where }),
    ]);

    res.json({ moves, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
};
