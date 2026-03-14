const prisma = require('../utils/prisma');
const { logActivity } = require('../utils/activityLogger');

exports.getProducts = async (req, res, next) => {
  try {
    const { search, categoryId, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, name: true } },
          stockLevels: {
            include: { location: { include: { warehouse: { select: { name: true } } } } },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    const productsWithStock = products.map((p) => {
      const totalStock = p.stockLevels.reduce((sum, sl) => sum + sl.quantity, 0);
      return { ...p, totalStock };
    });

    res.json({ products: productsWithStock, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
};

exports.getProduct = async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
        stockLevels: {
          include: { location: { include: { warehouse: { select: { id: true, name: true } } } } },
        },
      },
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const totalStock = product.stockLevels.reduce((sum, sl) => sum + sl.quantity, 0);
    res.json({ ...product, totalStock });
  } catch (err) {
    next(err);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const { name, sku, categoryId, unitOfMeasure, description, imageUrl, costPrice, reorderPoint, reorderQty } = req.body;

    const product = await prisma.product.create({
      data: {
        name,
        sku,
        categoryId: categoryId || null,
        unitOfMeasure: unitOfMeasure || 'Units',
        description,
        imageUrl,
        costPrice: costPrice || 0,
        reorderPoint: reorderPoint || 0,
        reorderQty: reorderQty || 0,
      },
      include: { category: true },
    });

    await logActivity(req.user.id, 'CREATE', 'Product', product.id, `Created product: ${name} (${sku})`);

    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const { name, sku, categoryId, unitOfMeasure, description, imageUrl, costPrice, reorderPoint, reorderQty } = req.body;

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(sku !== undefined && { sku }),
        ...(categoryId !== undefined && { categoryId: categoryId || null }),
        ...(unitOfMeasure !== undefined && { unitOfMeasure }),
        ...(description !== undefined && { description }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(costPrice !== undefined && { costPrice }),
        ...(reorderPoint !== undefined && { reorderPoint }),
        ...(reorderQty !== undefined && { reorderQty }),
      },
      include: { category: true },
    });

    res.json(product);
  } catch (err) {
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const id = req.params.id;

    await prisma.$transaction([
      prisma.moveHistory.deleteMany({ where: { productId: id } }),
      prisma.stockOperationLine.deleteMany({ where: { productId: id } }),
      prisma.stockLevel.deleteMany({ where: { productId: id } }),
      prisma.product.delete({ where: { id } }),
    ]);

    res.json({ message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
};

exports.getProductStock = async (req, res, next) => {
  try {
    const stockLevels = await prisma.stockLevel.findMany({
      where: { productId: req.params.id },
      include: {
        location: { include: { warehouse: { select: { id: true, name: true, code: true } } } },
      },
    });
    res.json(stockLevels);
  } catch (err) {
    next(err);
  }
};
