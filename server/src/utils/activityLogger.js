const prisma = require('./prisma');

async function logActivity(userId, action, entityType, entityId = null, details = null, ipAddress = null) {
  try {
    await prisma.activityLog.create({
      data: { userId, action, entityType, entityId, details, ipAddress },
    });
  } catch (err) {
    console.error('Activity log error:', err.message);
  }
}

module.exports = { logActivity };
