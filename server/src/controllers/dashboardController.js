const prisma = require('../utils/prisma');

exports.getDashboard = async (req, res, next) => {
  try {
    const { warehouseId, categoryId, dateFrom, dateTo } = req.query;

    const dateFilter = {};
    if (dateFrom) dateFilter.createdAt = { ...dateFilter.createdAt, gte: new Date(dateFrom) };
    if (dateTo) dateFilter.createdAt = { ...dateFilter.createdAt, lte: new Date(dateTo) };

    const locationFilter = warehouseId
      ? { location: { warehouseId } }
      : {};

    const productFilter = categoryId
      ? { categoryId }
      : {};

    // KPIs
    const [
      totalProducts,
      lowStockItems,
      outOfStockItems,
      pendingReceipts,
      pendingDeliveries,
      scheduledTransfers,
    ] = await Promise.all([
      prisma.product.count({ where: productFilter }),
      prisma.stockLevel.count({
        where: {
          ...locationFilter,
          product: { ...productFilter, reorderPoint: { gt: 0 } },
          quantity: { gt: 0, lte: prisma.raw ? 0 : undefined },
        },
      }).catch(() => 0),
      prisma.stockLevel.count({
        where: { ...locationFilter, quantity: { lte: 0 }, product: productFilter },
      }),
      prisma.stockOperation.count({
        where: { type: 'RECEIPT', status: { in: ['DRAFT', 'WAITING', 'READY'] }, ...dateFilter },
      }),
      prisma.stockOperation.count({
        where: { type: 'DELIVERY', status: { in: ['DRAFT', 'WAITING', 'READY'] }, ...dateFilter },
      }),
      prisma.stockOperation.count({
        where: { type: 'TRANSFER', status: { in: ['DRAFT', 'WAITING', 'READY'] }, ...dateFilter },
      }),
    ]);

    // Low stock: products where any stock level is below reorder point
    const lowStockProducts = await prisma.$queryRaw`
      SELECT p.id, p.name, p.sku, p.reorder_point,
             COALESCE(SUM(sl.quantity), 0)::int as total_stock
      FROM products p
      LEFT JOIN stock_levels sl ON sl.product_id = p.id
      WHERE p.reorder_point > 0
      GROUP BY p.id, p.name, p.sku, p.reorder_point
      HAVING COALESCE(SUM(sl.quantity), 0) <= p.reorder_point
      LIMIT 10
    `;

    // Recent operations - role-based
    const opWhere = {};
    if (req.user.role === 'WAREHOUSE_STAFF') {
      opWhere.createdBy = req.user.id;
    }

    const recentOperations = await prisma.stockOperation.findMany({
      where: { ...opWhere, ...dateFilter },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { name: true } },
        sourceLocation: { select: { id: true, name: true, warehouse: { select: { id: true, name: true } } } },
        destinationLocation: { select: { id: true, name: true, warehouse: { select: { id: true, name: true } } } },
        _count: { select: { lines: true } },
      },
    });

    res.json({
      kpis: {
        totalProducts,
        lowStockItems: lowStockProducts.length,
        outOfStockItems,
        pendingReceipts,
        pendingDeliveries,
        scheduledTransfers,
      },
      lowStockProducts,
      recentOperations,
    });
  } catch (err) {
    next(err);
  }
};
