import app from './app.js';
import config from './config/env.js';
import { connectDB } from './config/db.js';

const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Start HTTP Server
    const server = app.listen(config.port, () => {
      console.log(`
=====================================================
🚀 KubeMentor Server Running!
-----------------------------------------------------
🌐 Environment : ${config.nodeEnv}
🔌 Port        : ${config.port}
🔗 Base API     : http://localhost:${config.port}/api/v1
=====================================================
      `);
    });

    // Handle Unhandled Rejections
    process.on('unhandledRejection', (err) => {
      console.error(`[Unhandled Rejection]: ${err.message}`);
      server.close(() => process.exit(1));
    });
  } catch (error) {
    console.error(`[Server Initialization Error]: ${error.message}`);
    process.exit(1);
  }
};

startServer();
