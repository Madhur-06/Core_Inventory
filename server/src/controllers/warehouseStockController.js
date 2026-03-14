const prisma = require('../utils/prisma');

exports.getWarehouseStock = async (req, res, next) => {
  try {
    const { warehouseId } = req.query;

    let stock;
    if (warehouseId) {
      stock = await prisma.$queryRaw`
        SELECT 
          w.id as warehouse_id, w.name as warehouse_name, w.code as warehouse_code,
          l.id as location_id, l.name as location_name, l.code as location_code,
          p.id as product_id, p.name as product_name, p.sku as product_sku,
          pc.name as category_name, p.unit_of_measure, p.reorder_point,
          sl.quantity, sl.reserved_qty
        FROM stock_levels sl
        JOIN products p ON p.id = sl.product_id
        JOIN locations l ON l.id = sl.location_id
        JOIN warehouses w ON w.id = l.warehouse_id
        LEFT JOIN product_categories pc ON pc.id = p.category_id
        WHERE w.id = ${warehouseId}
        ORDER BY w.name, l.name, p.name
      `;
    } else {
      stock = await prisma.$queryRaw`
        SELECT 
          w.id as warehouse_id, w.name as warehouse_name, w.code as warehouse_code,
          l.id as location_id, l.name as location_name, l.code as location_code,
          p.id as product_id, p.name as product_name, p.sku as product_sku,
          pc.name as category_name, p.unit_of_measure, p.reorder_point,
          sl.quantity, sl.reserved_qty
        FROM stock_levels sl
        JOIN products p ON p.id = sl.product_id
        JOIN locations l ON l.id = sl.location_id
        JOIN warehouses w ON w.id = l.warehouse_id
        LEFT JOIN product_categories pc ON pc.id = p.category_id
        ORDER BY w.name, l.name, p.name
      `;
    }

    // Group by warehouse
    const grouped = {};
    for (const row of stock) {
      const whId = row.warehouse_id;
      if (!grouped[whId]) {
        grouped[whId] = {
          id: whId,
          name: row.warehouse_name,
          code: row.warehouse_code,
          locations: {},
          totalItems: 0,
          totalQuantity: 0,
        };
      }

      const locId = row.location_id;
      if (!grouped[whId].locations[locId]) {
        grouped[whId].locations[locId] = {
          id: locId,
          name: row.location_name,
          code: row.location_code,
          products: [],
        };
      }

      grouped[whId].locations[locId].products.push({
        id: row.product_id,
        name: row.product_name,
        sku: row.product_sku,
        category: row.category_name,
        unitOfMeasure: row.unit_of_measure,
        reorderPoint: row.reorder_point,
        quantity: row.quantity,
        reservedQty: row.reserved_qty,
      });

      grouped[whId].totalItems += 1;
      grouped[whId].totalQuantity += Number(row.quantity);
    }

    // Convert locations map to array
    const warehouses = Object.values(grouped).map((wh) => ({
      ...wh,
      locations: Object.values(wh.locations),
    }));

    res.json(warehouses);
  } catch (err) {
    next(err);
  }
};
