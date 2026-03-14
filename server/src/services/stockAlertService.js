const prisma = require('../utils/prisma');
const { sendMail } = require('../utils/mailer');

const checkAndSendLowStockAlerts = async () => {
  try {
    // Get low stock products
    const lowStock = await prisma.$queryRaw`
      SELECT p.id, p.name, p.sku, p.reorder_point,
             COALESCE(SUM(sl.quantity), 0)::int as total_stock
      FROM products p
      LEFT JOIN stock_levels sl ON sl.product_id = p.id
      WHERE p.reorder_point > 0
      GROUP BY p.id, p.name, p.sku, p.reorder_point
      HAVING COALESCE(SUM(sl.quantity), 0) <= p.reorder_point
    `;

    if (lowStock.length === 0) return;

    // Get all manager emails
    const managers = await prisma.user.findMany({
      where: { role: 'INVENTORY_MANAGER', isActive: true },
      select: { email: true, name: true },
    });

    if (managers.length === 0) return;

    const itemRows = lowStock.map(p =>
      `<tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${p.name}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-family: monospace;">${p.sku}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: ${p.total_stock === 0 ? '#dc2626' : '#d97706'}; font-weight: bold;">${p.total_stock}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${p.reorder_point}</td>
      </tr>`
    ).join('');

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #7c3aed;">⚠️ Low Stock Alert</h2>
        <p style="color: #6b7280;">${lowStock.length} product(s) are at or below their reorder point:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <thead>
            <tr style="background: #f9fafb;">
              <th style="padding: 8px 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Product</th>
              <th style="padding: 8px 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">SKU</th>
              <th style="padding: 8px 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Current</th>
              <th style="padding: 8px 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Reorder At</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
        <p style="color: #9ca3af; font-size: 12px;">This is an automated alert from Core Inventory.</p>
      </div>
    `;

    for (const mgr of managers) {
      sendMail(mgr.email, `Low Stock Alert — ${lowStock.length} product(s) need attention`, html)
        .catch(err => console.error(`[ALERT] Failed to email ${mgr.email}:`, err.message));
    }

    console.log(`[ALERT] Low stock alert sent to ${managers.length} manager(s) for ${lowStock.length} product(s)`);
  } catch (err) {
    console.error('[ALERT] Stock alert check failed:', err.message);
  }
};

module.exports = { checkAndSendLowStockAlerts };
