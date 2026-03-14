const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');

exports.listUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (err) {
    next(err);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, passwordHash, name, role: role || 'WAREHOUSE_STAFF' },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    // Check if user has associated operations
    const opCount = await prisma.stockOperation.count({ where: { createdBy: id } });
    if (opCount > 0) {
      return res.status(400).json({ error: `Cannot delete — this user has ${opCount} operation(s) on record. Deactivating is recommended instead.` });
    }

    await prisma.user.delete({ where: { id } });
    res.json({ message: 'User deleted' });
  } catch (err) {
    next(err);
  }
};

exports.toggleUserActive = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ error: 'You cannot disable your own account' });
    }

    const target = await prisma.user.findUnique({ where: { id }, select: { isActive: true } });
    if (!target) return res.status(404).json({ error: 'User not found' });

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !target.isActive },
      select: { id: true, name: true, isActive: true },
    });

    res.json({ message: `User ${updated.isActive ? 'enabled' : 'disabled'}`, user: updated });
  } catch (err) {
    next(err);
  }
};
