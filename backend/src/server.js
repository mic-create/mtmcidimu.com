import app from './app.js';
import { env } from './config/env.js';
import prisma from './config/database.js';

const PORT = env.PORT;

const server = app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(` Mother Teresa Medical Centre API`);
  console.log(` Server running in [${env.NODE_ENV}] mode on port ${PORT}`);
  console.log(` Health Endpoint: http://localhost:${PORT}/health`);
  console.log(`==================================================`);
});

// Handle graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n[${signal}] Signal received. Closing HTTP server and database connection...`);
  
  server.close(async () => {
    console.log('HTTP server closed.');
    await prisma.$disconnect();
    console.log('Prisma disconnected.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// server.js / app.js
const adminRoutes = require('./routes/admin');

// Mount Admin Protected API
app.use('/api/admin', adminRoutes);