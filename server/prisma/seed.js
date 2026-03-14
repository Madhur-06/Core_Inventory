const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.moveHistory.deleteMany();
  await prisma.stockOperationLine.deleteMany();
  await prisma.stockOperation.deleteMany();
  await prisma.stockLevel.deleteMany();
  await prisma.product.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.location.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.otp.deleteMany();
  await prisma.user.deleteMany();

  // Users
  const passwordHash = await bcrypt.hash('password123', 12);

  const manager = await prisma.user.create({
    data: {
      email: 'manager@coreinventory.com',
      passwordHash,
      name: 'Aarya Patel',
      role: 'INVENTORY_MANAGER',
    },
  });

  const staff = await prisma.user.create({
    data: {
      email: 'staff@coreinventory.com',
      passwordHash,
      name: 'Warehouse Staff',
      role: 'WAREHOUSE_STAFF',
    },
  });

  // Warehouses
  const mainWarehouse = await prisma.warehouse.create({
    data: {
      name: 'Main Warehouse',
      code: 'WH-MAIN',
      address: '123 Industrial Blvd, Suite 100',
    },
  });

  const secondWarehouse = await prisma.warehouse.create({
    data: {
      name: 'Secondary Warehouse',
      code: 'WH-SEC',
      address: '456 Commerce St, Unit 200',
    },
  });

  // Locations
  const rackA = await prisma.location.create({
    data: { warehouseId: mainWarehouse.id, name: 'Rack A', code: 'RACK-A' },
  });

  const rackB = await prisma.location.create({
    data: { warehouseId: mainWarehouse.id, name: 'Rack B', code: 'RACK-B' },
  });

  const prodFloor = await prisma.location.create({
    data: { warehouseId: mainWarehouse.id, name: 'Production Floor', code: 'PROD-FLOOR' },
  });

  const secStorage = await prisma.location.create({
    data: { warehouseId: secondWarehouse.id, name: 'Storage Area', code: 'STORAGE-A' },
  });

  // Categories
  const rawMaterials = await prisma.productCategory.create({
    data: { name: 'Raw Materials', description: 'Basic materials used in production' },
  });

  const finished = await prisma.productCategory.create({
    data: { name: 'Finished Goods', description: 'Ready-to-ship products' },
  });

  const packaging = await prisma.productCategory.create({
    data: { name: 'Packaging', description: 'Boxes, wraps, and packaging materials' },
  });

  const office = await prisma.productCategory.create({
    data: { name: 'Office Supplies', description: 'Office and stationery items' },
  });

  // Products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Steel Rods',
        sku: 'RM-STL-001',
        categoryId: rawMaterials.id,
        unitOfMeasure: 'Pieces',
        description: 'High-grade steel rods for construction',
        reorderPoint: 20,
        reorderQty: 50,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Wooden Chairs',
        sku: 'FG-CHR-001',
        categoryId: finished.id,
        unitOfMeasure: 'Pieces',
        description: 'Handcrafted wooden chairs',
        reorderPoint: 10,
        reorderQty: 25,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Cardboard Boxes (Large)',
        sku: 'PK-BOX-L01',
        categoryId: packaging.id,
        unitOfMeasure: 'Pieces',
        description: 'Large cardboard boxes for shipping',
        reorderPoint: 50,
        reorderQty: 200,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Copper Wire',
        sku: 'RM-CPR-001',
        categoryId: rawMaterials.id,
        unitOfMeasure: 'Meters',
        description: 'Insulated copper wire for electrical',
        reorderPoint: 100,
        reorderQty: 500,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Office Desk',
        sku: 'FG-DSK-001',
        categoryId: finished.id,
        unitOfMeasure: 'Pieces',
        description: 'Modern office desks',
        reorderPoint: 5,
        reorderQty: 15,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Printer Paper A4',
        sku: 'OS-PPR-A4',
        categoryId: office.id,
        unitOfMeasure: 'Reams',
        description: 'A4 size printer paper, 500 sheets per ream',
        reorderPoint: 20,
        reorderQty: 50,
      },
    }),
  ]);

  // Stock Levels
  const stockEntries = [
    { productId: products[0].id, locationId: rackA.id, quantity: 45 },
    { productId: products[0].id, locationId: secStorage.id, quantity: 30 },
    { productId: products[1].id, locationId: rackB.id, quantity: 8 },  // below reorder
    { productId: products[2].id, locationId: rackA.id, quantity: 150 },
    { productId: products[3].id, locationId: prodFloor.id, quantity: 50 }, // below reorder
    { productId: products[4].id, locationId: rackB.id, quantity: 12 },
    { productId: products[5].id, locationId: secStorage.id, quantity: 5 }, // below reorder
  ];

  await prisma.stockLevel.createMany({ data: stockEntries });

  console.log('Seed complete!');
  console.log(`  Users: ${manager.email} / ${staff.email} (password: password123)`);
  console.log(`  Warehouses: ${mainWarehouse.name}, ${secondWarehouse.name}`);
  console.log(`  Products: ${products.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
