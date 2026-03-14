const prisma = require('../utils/prisma');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');

exports.exportProducts = async (req, res, next) => {
  try {
    const { format = 'csv' } = req.query;

    const products = await prisma.product.findMany({
      include: {
        category: { select: { name: true } },
        stockLevels: true,
      },
      orderBy: { name: 'asc' },
    });

    const rows = products.map((p) => ({
      Name: p.name,
      SKU: p.sku,
      Category: p.category?.name || 'Uncategorized',
      'Unit of Measure': p.unitOfMeasure,
      'Cost Price': p.costPrice,
      'Total Stock': p.stockLevels.reduce((s, sl) => s + sl.quantity, 0),
      'Reorder Point': p.reorderPoint,
      'Reorder Qty': p.reorderQty,
    }));

    if (format === 'pdf') {
      return exportPdf(res, 'Products Report', ['Name', 'SKU', 'Category', 'Unit of Measure', 'Cost Price', 'Total Stock', 'Reorder Point'], rows);
    }

    const parser = new Parser({ fields: Object.keys(rows[0] || {}) });
    const csv = parser.parse(rows);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=products.csv');
    res.send(csv);
  } catch (err) {
    next(err);
  }
};

exports.exportOperations = async (req, res, next) => {
  try {
    const { format = 'csv', type, status } = req.query;
    const where = {};
    if (type) where.type = type;
    if (status) where.status = status;

    const operations = await prisma.stockOperation.findMany({
      where,
      include: {
        creator: { select: { name: true } },
        lines: { include: { product: { select: { name: true, sku: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const rows = operations.map((op) => ({
      Reference: op.referenceNumber,
      Type: op.type,
      Status: op.status,
      Supplier: op.supplierName || '',
      Customer: op.customerName || '',
      Items: op.lines.length,
      'Created By': op.creator?.name || '',
      'Created At': op.createdAt.toISOString().split('T')[0],
      'Validated At': op.validatedAt ? op.validatedAt.toISOString().split('T')[0] : '',
    }));

    if (format === 'pdf') {
      return exportPdf(res, 'Operations Report', ['Reference', 'Type', 'Status', 'Supplier', 'Customer', 'Items', 'Created By', 'Created At'], rows);
    }

    const parser = new Parser({ fields: Object.keys(rows[0] || {}) });
    const csv = parser.parse(rows);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=operations.csv');
    res.send(csv);
  } catch (err) {
    next(err);
  }
};

exports.exportMoveHistory = async (req, res, next) => {
  try {
    const { format = 'csv' } = req.query;

    const moves = await prisma.moveHistory.findMany({
      include: {
        product: { select: { name: true, sku: true } },
        location: { include: { warehouse: { select: { name: true } } } },
        operation: { select: { referenceNumber: true } },
        creator: { select: { name: true } },
      },
      orderBy: { timestamp: 'desc' },
      take: 1000,
    });

    const rows = moves.map((m) => ({
      Date: m.timestamp.toISOString().split('T')[0],
      Product: m.product.name,
      SKU: m.product.sku,
      Warehouse: m.location?.warehouse?.name || '',
      Location: m.location?.name || '',
      Type: m.moveType,
      Change: m.quantityChange,
      'Balance After': m.balanceAfter,
      Reference: m.operation?.referenceNumber || '',
      'Done By': m.creator?.name || '',
    }));

    if (format === 'pdf') {
      return exportPdf(res, 'Move History Report', ['Date', 'Product', 'SKU', 'Warehouse', 'Type', 'Change', 'Balance After', 'Reference'], rows);
    }

    const parser = new Parser({ fields: Object.keys(rows[0] || {}) });
    const csv = parser.parse(rows);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=move-history.csv');
    res.send(csv);
  } catch (err) {
    next(err);
  }
};

exports.exportStockReport = async (req, res, next) => {
  try {
    const { format = 'csv' } = req.query;

    const stock = await prisma.$queryRaw`
      SELECT 
        w.name as warehouse,
        l.name as location,
        p.name as product,
        p.sku,
        p.cost_price,
        sl.quantity,
        sl.reserved_qty,
        (sl.quantity * p.cost_price) as value
      FROM stock_levels sl
      JOIN products p ON p.id = sl.product_id
      JOIN locations l ON l.id = sl.location_id
      JOIN warehouses w ON w.id = l.warehouse_id
      ORDER BY w.name, l.name, p.name
    `;

    const rows = stock.map((s) => ({
      Warehouse: s.warehouse,
      Location: s.location,
      Product: s.product,
      SKU: s.sku,
      'Cost Price': Number(s.cost_price).toFixed(2),
      Quantity: s.quantity,
      Reserved: s.reserved_qty,
      Value: Number(s.value).toFixed(2),
    }));

    if (format === 'pdf') {
      return exportPdf(res, 'Stock Report', ['Warehouse', 'Location', 'Product', 'SKU', 'Quantity', 'Reserved', 'Value'], rows);
    }

    const parser = new Parser({ fields: Object.keys(rows[0] || {}) });
    const csv = parser.parse(rows);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=stock-report.csv');
    res.send(csv);
  } catch (err) {
    next(err);
  }
};

exports.exportMonthlyReport = async (req, res, next) => {
  try {
    const { month, format = 'csv' } = req.query;
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'month query param required in YYYY-MM format' });
    }

    const monthStart = new Date(`${month}-01T00:00:00Z`);
    const monthEnd = new Date(monthStart);
    monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1);

    // Stock movements for the month
    const movements = await prisma.$queryRaw`
      SELECT 
        p.name, p.sku,
        SUM(CASE WHEN mh.move_type IN ('IN','TRANSFER_IN') THEN mh.quantity_change ELSE 0 END)::int as received,
        ABS(SUM(CASE WHEN mh.move_type IN ('OUT','TRANSFER_OUT') THEN mh.quantity_change ELSE 0 END))::int as dispatched,
        SUM(CASE WHEN mh.move_type = 'ADJUSTMENT' THEN mh.quantity_change ELSE 0 END)::int as adjustments
      FROM move_history mh
      JOIN products p ON p.id = mh.product_id
      WHERE mh.timestamp >= ${monthStart} AND mh.timestamp < ${monthEnd}
      GROUP BY p.id, p.name, p.sku
      ORDER BY (SUM(ABS(mh.quantity_change))) DESC
    `;

    // Current stock per product and compute opening/closing
    const currentStocks = await prisma.$queryRaw`
      SELECT p.id, p.name, p.sku, COALESCE(SUM(sl.quantity), 0)::int as current_stock
      FROM products p
      LEFT JOIN stock_levels sl ON sl.product_id = p.id
      GROUP BY p.id, p.name, p.sku
    `;
    const stockMap = new Map(currentStocks.map((s) => [s.sku, s.current_stock]));

    // Net change since month end to compute closing stock at end of month
    const changesSinceMonthEnd = await prisma.$queryRaw`
      SELECT p.sku, COALESCE(SUM(mh.quantity_change), 0)::int as net_change
      FROM move_history mh
      JOIN products p ON p.id = mh.product_id
      WHERE mh.timestamp >= ${monthEnd}
      GROUP BY p.sku
    `;
    const sinceEndMap = new Map(changesSinceMonthEnd.map((c) => [c.sku, c.net_change]));

    const rows = movements.map((m) => {
      const currentStock = stockMap.get(m.sku) ?? 0;
      const changeSinceEnd = sinceEndMap.get(m.sku) ?? 0;
      const closingStock = currentStock - changeSinceEnd;
      const netChange = m.received - m.dispatched + m.adjustments;
      const openingStock = closingStock - netChange;
      return {
        Name: m.name,
        SKU: m.sku,
        'Opening Stock': openingStock,
        Received: m.received,
        Dispatched: m.dispatched,
        Adjustments: m.adjustments,
        'Closing Stock': closingStock,
      };
    });

    if (format === 'pdf') {
      return exportPdf(res, `Monthly Report - ${month}`,
        ['Name', 'SKU', 'Opening Stock', 'Received', 'Dispatched', 'Adjustments', 'Closing Stock'], rows);
    }

    const parser = new Parser({ fields: ['Name', 'SKU', 'Opening Stock', 'Received', 'Dispatched', 'Adjustments', 'Closing Stock'] });
    const csv = parser.parse(rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=monthly-report-${month}.csv`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
};

function exportPdf(res, title, columns, rows) {
  const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${title.replace(/\s/g, '-').toLowerCase()}.pdf`);
  doc.pipe(res);

  // Title
  doc.fontSize(18).font('Helvetica-Bold').text(title, { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(9).font('Helvetica').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
  doc.moveDown(1);

  // Table
  const colWidth = (doc.page.width - 60) / columns.length;
  let y = doc.y;

  // Header
  doc.font('Helvetica-Bold').fontSize(8);
  columns.forEach((col, i) => {
    doc.text(col, 30 + i * colWidth, y, { width: colWidth, align: 'left' });
  });
  y += 15;
  doc.moveTo(30, y).lineTo(doc.page.width - 30, y).stroke();
  y += 5;

  // Rows
  doc.font('Helvetica').fontSize(7);
  for (const row of rows) {
    if (y > doc.page.height - 50) {
      doc.addPage();
      y = 30;
    }
    columns.forEach((col, i) => {
      doc.text(String(row[col] ?? ''), 30 + i * colWidth, y, { width: colWidth, align: 'left' });
    });
    y += 13;
  }

  doc.end();
}
