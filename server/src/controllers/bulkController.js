const multer = require('multer');
const prisma = require('../utils/prisma');
const { logActivity } = require('../utils/activityLogger');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

exports.uploadMiddleware = upload.single('file');

exports.bulkImportProducts = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'CSV file required' });

    const content = req.file.buffer.toString('utf-8');
    const lines = content.split('\n').filter((l) => l.trim());
    if (lines.length < 2) return res.status(400).json({ error: 'CSV must have a header row and at least one data row' });

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''));
    const results = { created: 0, updated: 0, errors: [] };

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map((v) => v.trim().replace(/"/g, ''));
        const row = {};
        headers.forEach((h, idx) => { row[h] = values[idx] || ''; });

        const name = row.name || row.product;
        const sku = row.sku || row.code;
        if (!name || !sku) {
          results.errors.push({ row: i + 1, error: 'Name and SKU are required' });
          continue;
        }

        // Find or create category
        let categoryId = null;
        const categoryName = row.category;
        if (categoryName) {
          const cat = await prisma.productCategory.upsert({
            where: { name: categoryName },
            create: { name: categoryName },
            update: {},
          });
          categoryId = cat.id;
        }

        const existing = await prisma.product.findUnique({ where: { sku } });
        if (existing) {
          await prisma.product.update({
            where: { sku },
            data: {
              name,
              ...(categoryId && { categoryId }),
              ...(row['unit'] && { unitOfMeasure: row['unit'] }),
              ...(row['unit of measure'] && { unitOfMeasure: row['unit of measure'] }),
              ...(row['cost price'] && { costPrice: parseFloat(row['cost price']) || 0 }),
              ...(row['cost'] && { costPrice: parseFloat(row['cost']) || 0 }),
              ...(row['reorder point'] && { reorderPoint: parseInt(row['reorder point']) || 0 }),
              ...(row['reorder qty'] && { reorderQty: parseInt(row['reorder qty']) || 0 }),
              ...(row.description && { description: row.description }),
            },
          });
          results.updated++;
        } else {
          await prisma.product.create({
            data: {
              name,
              sku,
              categoryId,
              unitOfMeasure: row['unit'] || row['unit of measure'] || 'Units',
              costPrice: parseFloat(row['cost price'] || row['cost'] || '0') || 0,
              reorderPoint: parseInt(row['reorder point'] || '0') || 0,
              reorderQty: parseInt(row['reorder qty'] || '0') || 0,
              description: row.description || null,
            },
          });
          results.created++;
        }
      } catch (err) {
        results.errors.push({ row: i + 1, error: err.message });
      }
    }

    await logActivity(req.user.id, 'BULK_IMPORT', 'Product', null, `Created: ${results.created}, Updated: ${results.updated}, Errors: ${results.errors.length}`);

    res.json(results);
  } catch (err) {
    next(err);
  }
};

exports.bulkAdjustStock = async (req, res, next) => {
  try {
    const { adjustments } = req.body; // [{productId, locationId, newQuantity}]
    if (!Array.isArray(adjustments) || adjustments.length === 0) {
      return res.status(400).json({ error: 'Adjustments array required' });
    }

    const results = { adjusted: 0, errors: [] };

    await prisma.$transaction(async (tx) => {
      for (const adj of adjustments) {
        try {
          const current = await tx.stockLevel.findUnique({
            where: { productId_locationId: { productId: adj.productId, locationId: adj.locationId } },
          });

          const oldQty = current?.quantity || 0;
          const newQty = parseInt(adj.newQuantity);
          const diff = newQty - oldQty;

          const sl = await tx.stockLevel.upsert({
            where: { productId_locationId: { productId: adj.productId, locationId: adj.locationId } },
            create: { productId: adj.productId, locationId: adj.locationId, quantity: newQty },
            update: { quantity: newQty },
          });

          await tx.moveHistory.create({
            data: {
              productId: adj.productId,
              locationId: adj.locationId,
              quantityChange: diff,
              balanceAfter: sl.quantity,
              moveType: 'ADJUSTMENT',
              createdBy: req.user.id,
            },
          });

          results.adjusted++;
        } catch (err) {
          results.errors.push({ productId: adj.productId, error: err.message });
        }
      }
    });

    await logActivity(req.user.id, 'BULK_ADJUSTMENT', 'StockLevel', null, `Adjusted: ${results.adjusted}`);

    res.json(results);
  } catch (err) {
    next(err);
  }
};
