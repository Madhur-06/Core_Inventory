const prisma = require('../utils/prisma');

exports.getStockMovementChart = async (req, res, next) => {
  try {
    const { period = '30', warehouseId } = req.query;
    const days = parseInt(period);
    const since = new Date();
    since.setDate(since.getDate() - days);

    const warehouseFilter = warehouseId
      ? `AND l.warehouse_id = '${warehouseId}'`
      : '';

    const data = await prisma.$queryRawUnsafe(`
      SELECT 
        DATE(mh.timestamp) as date,
        SUM(CASE WHEN mh.move_type IN ('IN', 'TRANSFER_IN') THEN mh.quantity_change ELSE 0 END)::int as stock_in,
        ABS(SUM(CASE WHEN mh.move_type IN ('OUT', 'TRANSFER_OUT') THEN mh.quantity_change ELSE 0 END))::int as stock_out,
        SUM(CASE WHEN mh.move_type = 'ADJUSTMENT' THEN mh.quantity_change ELSE 0 END)::int as adjustments,
        COUNT(*)::int as total_moves
      FROM move_history mh
      JOIN locations l ON l.id = mh.location_id
      WHERE mh.timestamp >= $1 ${warehouseFilter}
      GROUP BY DATE(mh.timestamp)
      ORDER BY date ASC
    `, since);

    // Also get category breakdown
    const categoryBreakdown = await prisma.$queryRawUnsafe(`
      SELECT 
        COALESCE(pc.name, 'Uncategorized') as category,
        SUM(sl.quantity)::int as total_stock,
        COUNT(DISTINCT p.id)::int as product_count
      FROM stock_levels sl
      JOIN products p ON p.id = sl.product_id
      JOIN locations l ON l.id = sl.location_id
      LEFT JOIN product_categories pc ON pc.id = p.category_id
      WHERE sl.quantity > 0 ${warehouseFilter}
      GROUP BY pc.name
      ORDER BY total_stock DESC
    `);

    // Top movers (most active products)
    const topMovers = await prisma.$queryRawUnsafe(`
      SELECT 
        p.name,
        p.sku,
        COUNT(*)::int as move_count,
        SUM(ABS(mh.quantity_change))::int as total_volume
      FROM move_history mh
      JOIN products p ON p.id = mh.product_id
      JOIN locations l ON l.id = mh.location_id
      WHERE mh.timestamp >= $1 ${warehouseFilter}
      GROUP BY p.id, p.name, p.sku
      ORDER BY total_volume DESC
      LIMIT 10
    `, since);

    res.json({ dailyMovements: data, categoryBreakdown, topMovers });
  } catch (err) {
    next(err);
  }
};

exports.getInventoryValuation = async (req, res, next) => {
  try {
    const { warehouseId } = req.query;

    const warehouseFilter = warehouseId
      ? `AND l.warehouse_id = '${warehouseId}'`
      : '';

    const valuation = await prisma.$queryRawUnsafe(`
      SELECT 
        COALESCE(w.name, 'Total') as warehouse_name,
        SUM(sl.quantity)::int as total_units,
        SUM(sl.quantity * p.cost_price)::float as total_value,
        COUNT(DISTINCT p.id)::int as product_count
      FROM stock_levels sl
      JOIN products p ON p.id = sl.product_id
      JOIN locations l ON l.id = sl.location_id
      JOIN warehouses w ON w.id = l.warehouse_id
      WHERE sl.quantity > 0 ${warehouseFilter}
      GROUP BY ROLLUP(w.name)
      ORDER BY total_value DESC NULLS FIRST
    `);

    // Per-product valuation
    const productValuation = await prisma.$queryRawUnsafe(`
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.cost_price,
        COALESCE(SUM(sl.quantity), 0)::int as total_qty,
        (COALESCE(SUM(sl.quantity), 0) * p.cost_price)::float as total_value
      FROM products p
      LEFT JOIN stock_levels sl ON sl.product_id = p.id
      LEFT JOIN locations l ON l.id = sl.location_id
      WHERE 1=1 ${warehouseFilter}
      GROUP BY p.id, p.name, p.sku, p.cost_price
      HAVING COALESCE(SUM(sl.quantity), 0) > 0
      ORDER BY total_value DESC
      LIMIT 20
    `);

    res.json({ warehouseValuation: valuation, productValuation });
  } catch (err) {
    next(err);
  }
};

exports.getProductStockHistory = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const since = new Date();
    since.setDate(since.getDate() - days);

    const dailyChanges = await prisma.$queryRaw`
      SELECT 
        DATE(mh.timestamp) as date,
        SUM(mh.quantity_change)::int as daily_change
      FROM move_history mh
      WHERE mh.product_id = ${productId} AND mh.timestamp >= ${since}
      GROUP BY DATE(mh.timestamp)
      ORDER BY date ASC
    `;

    const currentStockResult = await prisma.$queryRaw`
      SELECT COALESCE(SUM(sl.quantity), 0)::int as current_stock
      FROM stock_levels sl WHERE sl.product_id = ${productId}
    `;
    const currentStock = currentStockResult[0]?.current_stock ?? 0;

    // Compute running balance working backwards from current stock
    const totalChange = dailyChanges.reduce((sum, d) => sum + d.daily_change, 0);
    let balance = currentStock - totalChange;
    const history = dailyChanges.map((d) => {
      balance += d.daily_change;
      return { date: d.date, balance };
    });

    res.json({ productId, currentStock, history });
  } catch (err) {
    next(err);
  }
};
