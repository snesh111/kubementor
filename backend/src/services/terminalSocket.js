import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import User from '../models/User.js';
import Project from '../models/Project.js';
import DeploymentRecord from '../models/DeploymentRecord.js';
import ScenarioAttempt from '../models/ScenarioAttempt.js';
import k8sClientWrapper from '../kubernetes/k8sClient.js';
import { TerminalSession } from './terminalService.js';

const activeSessions = new Map(); // socketId -> { session, ws, timer }

export const initTerminalWebSocket = (httpServer) => {
  const wss = new WebSocketServer({
    server: httpServer,
    path: '/ws/terminal',
  });

  console.log('[Terminal Socket] WebSocket server initialized on path: /ws/terminal');

  wss.on('connection', async (ws, req) => {
    let socketId = Math.random().toString(36).substring(2, 15);
    console.log(`[Terminal Socket] New connection attempt: ${socketId}`);

    try {
      // 1. Extract query params from URL
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const token = url.searchParams.get('token');
      const labId = url.searchParams.get('labId');

      if (!token) {
        ws.send(JSON.stringify({ type: 'error', message: 'Authentication required: missing token.' }));
        ws.close(4001, 'Unauthorized');
        return;
      }

      if (!labId) {
        ws.send(JSON.stringify({ type: 'error', message: 'labId query parameter is required.' }));
        ws.close(4002, 'Missing labId');
        return;
      }

      // 2. Verify JWT Token
      let decoded;
      try {
        decoded = jwt.verify(token, config.jwtSecret);
      } catch (jwtErr) {
        ws.send(JSON.stringify({ type: 'error', message: 'Authentication failed: invalid or expired token.' }));
        ws.close(4003, 'Invalid token');
        return;
      }

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        ws.send(JSON.stringify({ type: 'error', message: 'User account not found.' }));
        ws.close(4004, 'User not found');
        return;
      }

      // 3. Resolve Internal Lab Project & Active Session
      const project = await Project.findOne({
        owner: user._id,
        isLabInternal: true,
        labId,
      });

      if (!project) {
        ws.send(JSON.stringify({
          type: 'error',
          message: `No active lab workspace found for scenario '${labId}'. Please start the lab first.`,
        }));
        ws.close(4005, 'Lab not initialized');
        return;
      }

      const deployment = await DeploymentRecord.findOne({
        project: project._id,
        user: user._id,
      }).sort({ createdAt: -1 });

      const attempt = await ScenarioAttempt.findOne({
        project: project._id,
        user: user._id,
        scenarioId: labId,
      }).sort({ createdAt: -1 });

      const namespace = deployment?.namespace || `kubementor-u${user._id.toString().slice(-6)}-p${project._id.toString().slice(-6)}`;
      const mode = k8sClientWrapper.isConnected ? 'kubernetes' : 'simulation';

      // 4. Instantiate Terminal Session
      const session = new TerminalSession({
        user,
        project,
        attempt,
        namespace,
        mode,
        sendOutput: (text) => {
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ type: 'output', data: text }));
          }
        },
      });

      // 5. Setup idle timeout check (15 minutes)
      const idleInterval = setInterval(() => {
        if (Date.now() - session.lastActivity > 15 * 60 * 1000) {
          ws.send(JSON.stringify({
            type: 'output',
            data: '\r\n\x1b[31m[Session Timeout] Terminal closed due to 15 minutes of inactivity.\x1b[0m\r\n',
          }));
          ws.close(4008, 'Idle timeout');
        }
      }, 60000);

      activeSessions.set(socketId, { session, ws, idleInterval });

      // 6. Notify Client that Terminal is Ready
      ws.send(JSON.stringify({
        type: 'ready',
        mode,
        namespace,
        labId,
        scenarioName: attempt?.scenarioName || labId,
      }));

      // Render initial welcome banner & prompt
      session.initTerminal();

      // 7. Message Router
      ws.on('message', (messageRaw) => {
        try {
          const msg = JSON.parse(messageRaw.toString());
          if (msg.type === 'input' && typeof msg.data === 'string') {
            session.handleInput(msg.data);
          } else if (msg.type === 'resize') {
            session.cols = msg.cols || session.cols;
            session.rows = msg.rows || session.rows;
          } else if (msg.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong' }));
          }
        } catch (e) {
          // If raw string sent instead of JSON, treat as raw input
          session.handleInput(messageRaw.toString());
        }
      });

      // 8. Connection Close & Cleanup
      ws.on('close', (code, reason) => {
        clearInterval(idleInterval);
        activeSessions.delete(socketId);
        console.log(`[Terminal Socket] Connection closed: ${socketId} (Code: ${code})`);
      });

      ws.on('error', (err) => {
        console.error(`[Terminal Socket] Socket error on ${socketId}:`, err.message);
      });

    } catch (fatalErr) {
      console.error('[Terminal Socket] Unexpected initialization error:', fatalErr);
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: 'error', message: 'Internal server error while initializing terminal.' }));
        ws.close(1011, 'Internal Error');
      }
    }
  });

  return wss;
};

export default initTerminalWebSocket;
