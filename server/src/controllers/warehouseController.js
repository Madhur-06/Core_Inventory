const prisma = require('../utils/prisma');

exports.getWarehouses = async (req, res, next) => {
  try {
    const warehouses = await prisma.warehouse.findMany({
      orderBy: { name: 'asc' },
      include: {
        locations: { orderBy: { name: 'asc' } },
        _count: { select: { locations: true } },
      },
    });
    res.json(warehouses);
  } catch (err) {
    next(err);
  }
};

exports.getWarehouse = async (req, res, next) => {
  try {
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: req.params.id },
      include: { locations: { orderBy: { name: 'asc' } } },
    });
    if (!warehouse) return res.status(404).json({ error: 'Warehouse not found' });
    res.json(warehouse);
  } catch (err) {
    next(err);
  }
};

exports.createWarehouse = async (req, res, next) => {
  try {
    const { name, code, address } = req.body;
    const warehouse = await prisma.warehouse.create({
      data: { name, code, address },
    });
    res.status(201).json(warehouse);
  } catch (err) {
    next(err);
  }
};

exports.updateWarehouse = async (req, res, next) => {
  try {
    const { name, code, address, isActive } = req.body;
    const warehouse = await prisma.warehouse.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(code !== undefined && { code }),
        ...(address !== undefined && { address }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    res.json(warehouse);
  } catch (err) {
    next(err);
  }
};

exports.deleteWarehouse = async (req, res, next) => {
  try {
    await prisma.warehouse.delete({ where: { id: req.params.id } });
    res.json({ message: 'Warehouse deleted' });
  } catch (err) {
    next(err);
  }
};

// Locations
exports.createLocation = async (req, res, next) => {
  try {
    const { name, code } = req.body;
    const location = await prisma.location.create({
      data: { warehouseId: req.params.id, name, code },
    });
    res.status(201).json(location);
  } catch (err) {
    next(err);
  }
};

exports.updateLocation = async (req, res, next) => {
  try {
    const { name, code } = req.body;
    const location = await prisma.location.update({
      where: { id: req.params.locationId },
      data: { ...(name !== undefined && { name }), ...(code !== undefined && { code }) },
    });
    res.json(location);
  } catch (err) {
    next(err);
  }
};

exports.deleteLocation = async (req, res, next) => {
  try {
    await prisma.location.delete({ where: { id: req.params.locationId } });
    res.json({ message: 'Location deleted' });
  } catch (err) {
    next(err);
  }
};
