const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./app/routes/auth');
const userRoutes = require('./app/routes/users');
const dashboardRoutes = require('./app/routes/dashboard');
const inventoryRoutes = require('./app/routes/inventory');
const ordersRoutes = require('./app/routes/orders');
const analyticsRoutes = require('./app/routes/analytics');
const predictionsRoutes = require('./app/routes/predictions');
const quotationsRoutes = require('./app/routes/quotations');
const feedbackRoutes = require('./app/routes/feedback');
const modelTrainingRoutes = require('./app/routes/model-training');
const suppliersRoutes = require('./app/routes/suppliers');
const serviceProviderRoutes = require('./app/routes/service-providers');
const notificationsRoutes = require('./app/routes/notifications');
const adminCommunicationsRoutes = require('./app/routes/admin-communications');
const contractsRoutes = require('./app/routes/contracts');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Daqeeq API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/predictions', predictionsRoutes);
app.use('/api/quotations', quotationsRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/model-training', modelTrainingRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/service-providers', serviceProviderRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/admin/communications', adminCommunicationsRoutes);
app.use('/api/contracts', contractsRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : err.message
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Daqeeq API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;