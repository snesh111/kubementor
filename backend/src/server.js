import app from './app.js';
import config from './config/env.js';
import { connectDB } from './config/db.js';
import k8sClientWrapper from './kubernetes/k8sClient.js';
import { initTerminalWebSocket } from './services/terminalSocket.js';

const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Ensure standard scenario catalog is seeded and clean
    const { scenarioService } = await import('./scenarios/scenarioService.js');
    await scenarioService.seedDefaultScenarios().catch((sErr) => {
      console.warn('[Server Startup] Scenario seed warning:', sErr.message);
    });

    // 3. Check Kubernetes connectivity (simulation fallback if unreachable)
    await k8sClientWrapper.verifyConnection().catch(() => {});

    // 3. Start HTTP Server
    const server = app.listen(config.port, () => {
      console.log(`[KubeMentor Server] Running on http://localhost:${config.port}/api/v1 (${config.nodeEnv})`);
    });

    // 4. Attach Interactive Terminal WebSocket Server
    initTerminalWebSocket(server);

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
