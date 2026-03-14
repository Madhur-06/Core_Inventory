const prisma = require('../utils/prisma');

exports.getAlerts = async (req, res, next) => {
  try {
    const lowStockProducts = await prisma.$queryRaw`
      SELECT p.id, p.name, p.sku, p.reorder_point, p.reorder_qty,
             COALESCE(SUM(sl.quantity), 0)::int as total_stock,
             CASE
               WHEN COALESCE(SUM(sl.quantity), 0) = 0 THEN 'OUT_OF_STOCK'
               ELSE 'LOW_STOCK'
             END as alert_type
      FROM products p
      LEFT JOIN stock_levels sl ON sl.product_id = p.id
      WHERE p.reorder_point > 0
      GROUP BY p.id, p.name, p.sku, p.reorder_point, p.reorder_qty
      HAVING COALESCE(SUM(sl.quantity), 0) <= p.reorder_point
      ORDER BY COALESCE(SUM(sl.quantity), 0) ASC
    `;

    res.json({
      alerts: lowStockProducts,
      count: lowStockProducts.length,
    });
  } catch (err) {
    next(err);
  }
};
