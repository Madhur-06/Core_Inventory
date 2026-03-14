require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const { authLimiter, otpLimiter, apiLimiter } = require('./middleware/rateLimiter');

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const warehouseRoutes = require('./routes/warehouses');
const operationRoutes = require('./routes/operations');
const moveHistoryRoutes = require('./routes/moveHistory');
const profileRoutes = require('./routes/profile');
const alertRoutes = require('./routes/alerts');
const warehouseStockRoutes = require('./routes/warehouseStock');
const analyticsRoutes = require('./routes/analytics');
const exportRoutes = require('./routes/exports');
const bulkRoutes = require('./routes/bulk');
const activityLogRoutes = require('./routes/activityLogs');
const userRoutes = require('./routes/users');

const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
app.use('/api/auth/login', authLimiter);
app.use('/api/users', authLimiter);
app.use('/api/auth/forgot-password', otpLimiter);
app.use('/api', apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/operations', operationRoutes);
app.use('/api/move-history', moveHistoryRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/warehouse-stock', warehouseStockRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/bulk', bulkRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Low stock alert check — runs every 6 hours
const { checkAndSendLowStockAlerts } = require('./services/stockAlertService');
setInterval(checkAndSendLowStockAlerts, 6 * 60 * 60 * 1000);
// Run once on startup after a short delay
setTimeout(checkAndSendLowStockAlerts, 10000);

module.exports = app;
