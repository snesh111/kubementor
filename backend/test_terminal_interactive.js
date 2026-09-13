import WebSocket from 'ws';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import http from 'http';
import dotenv from 'dotenv';
import app from './src/app.js';
import config from './src/config/env.js';
import User from './src/models/User.js';
import Project from './src/models/Project.js';
import ProjectFile from './src/models/ProjectFile.js';
import DeploymentRecord from './src/models/DeploymentRecord.js';
import ScenarioAttempt from './src/models/ScenarioAttempt.js';
import labService from './src/services/labService.js';
import { initTerminalWebSocket } from './src/services/terminalSocket.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/kubementor';
const TEST_PORT = 5099;

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`✅ [PASS] ${testName} ${details ? `(${details})` : ''}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${testName} ${details ? `(${details})` : ''}`);
    failed++;
  }
}

function sendAndCollectOutput(ws, command, waitMs = 400) {
  return new Promise((resolve) => {
    let outputBuffer = '';
    const onMsg = (msgRaw) => {
      try {
        const msg = JSON.parse(msgRaw.toString());
        if (msg.type === 'output') {
          outputBuffer += msg.data;
        }
      } catch (e) {
        outputBuffer += msgRaw.toString();
      }
    };

    ws.on('message', onMsg);
    ws.send(JSON.stringify({ type: 'input', data: command + '\r' }));

    setTimeout(() => {
      ws.off('message', onMsg);
      resolve(outputBuffer);
    }, waitMs);
  });
}

async function runTerminalTests() {
  console.log('========================================================');
  console.log('🧪 STARTING PART 4 INTERACTIVE TERMINAL TEST SUITE');
  console.log('========================================================\n');

  let server;
  let wss;

  try {
    await mongoose.connect(MONGO_URI);
    console.log('[MongoDB] Connected successfully for terminal tests\n');

    // Start dedicated test HTTP + WS Server
    server = http.createServer(app);
    wss = initTerminalWebSocket(server);

    await new Promise((resolve) => server.listen(TEST_PORT, resolve));
    console.log(`[Test Server] Running on http://localhost:${TEST_PORT}\n`);

    // Setup Test Users
    const suffix = Date.now().toString().slice(-4);
    const userA = await User.create({
      name: `Alice Terminal ${suffix}`,
      email: `alice_term_${suffix}@test.com`,
      password: 'Password123!',
      role: 'learner',
    });

    const userB = await User.create({
      name: `Bob Terminal ${suffix}`,
      email: `bob_term_${suffix}@test.com`,
      password: 'Password123!',
      role: 'learner',
    });

    const tokenA = jwt.sign({ id: userA._id }, config.jwtSecret, { expiresIn: '1h' });
    const tokenB = jwt.sign({ id: userB._id }, config.jwtSecret, { expiresIn: '1h' });

    // Provision Lab for User A
    const labSessionA = await labService.startLab(userA._id, 'crash-loop-backoff');
    console.log(`[Setup] Provisioned CrashLoopBackOff for Alice (${labSessionA.namespace})\n`);

    // 1. TEST: Unauthenticated WebSocket connection (missing token)
    console.log('--- TEST 1: Unauthenticated WebSocket Rejection ---');
    await new Promise((resolve) => {
      const ws = new WebSocket(`ws://localhost:${TEST_PORT}/ws/terminal?labId=crash-loop-backoff`);
      ws.on('close', (code) => {
        assert(code === 4001, 'Unauthenticated Connection Closed with 4001 Unauthorized', `Code: ${code}`);
        resolve();
      });
      ws.on('error', () => resolve());
    });

    // 2. TEST: Invalid Token Rejection
    console.log('\n--- TEST 2: Invalid JWT Token Rejection ---');
    await new Promise((resolve) => {
      const ws = new WebSocket(`ws://localhost:${TEST_PORT}/ws/terminal?token=invalid.fake.token&labId=crash-loop-backoff`);
      ws.on('close', (code) => {
        assert(code === 4003, 'Invalid Token Connection Closed with 4003', `Code: ${code}`);
        resolve();
      });
      ws.on('error', () => resolve());
    });

    // 3. TEST: User B attempts to access User A's unstarted lab
    console.log('\n--- TEST 3: User B Accessing Un-provisioned Lab ---');
    await new Promise((resolve) => {
      const ws = new WebSocket(`ws://localhost:${TEST_PORT}/ws/terminal?token=${tokenB}&labId=image-pull-backoff`);
      ws.on('close', (code) => {
        assert(code === 4005, 'Unstarted Lab Rejects Terminal Connection with 4005', `Code: ${code}`);
        resolve();
      });
      ws.on('error', () => resolve());
    });

    // 4. TEST: User A connects successfully to their active lab
    console.log('\n--- TEST 4: Authorized Interactive Terminal Session ---');
    const wsA = new WebSocket(`ws://localhost:${TEST_PORT}/ws/terminal?token=${tokenA}&labId=crash-loop-backoff`);

    await new Promise((resolve, reject) => {
      wsA.on('open', resolve);
      wsA.on('error', reject);
    });

    // Wait for ready message
    const readyMessage = await new Promise((resolve) => {
      const onMsg = (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.type === 'ready') {
            wsA.off('message', onMsg);
            resolve(msg);
          }
        } catch (e) {}
      };
      wsA.on('message', onMsg);
    });

    assert(readyMessage && readyMessage.type === 'ready', 'Received Ready Signal from WebSocket Server');
    assert(readyMessage.namespace === labSessionA.namespace, 'Terminal Bound to User Namespace', readyMessage.namespace);

    // 5. TEST: Basic Linux Commands (pwd, whoami, uname, ls, cat, env)
    console.log('\n--- TEST 5: Interactive Linux Commands ---');
    const pwdOut = await sendAndCollectOutput(wsA, 'pwd');
    assert(pwdOut.includes('/home/learner'), "Command 'pwd' Returns /home/learner");

    const whoamiOut = await sendAndCollectOutput(wsA, 'whoami');
    assert(whoamiOut.includes('learner'), "Command 'whoami' Returns learner");

    const lsOut = await sendAndCollectOutput(wsA, 'ls');
    assert(lsOut.includes('deployment.yaml'), "Command 'ls' Lists Workspace Manifests");

    const catOut = await sendAndCollectOutput(wsA, 'cat deployment.yaml');
    assert(catOut.includes('kind: Deployment'), "Command 'cat deployment.yaml' Displays Manifest Content");

    const envOut = await sendAndCollectOutput(wsA, 'env');
    assert(envOut.includes(`KUBERNETES_NAMESPACE=${labSessionA.namespace}`), "Command 'env' Contains Safe Namespace Variable");
    assert(!envOut.includes('MONGO_URI') && !envOut.includes('JWT_SECRET'), "Command 'env' Strictly Sanitized (No Backend Secrets Leaked)");

    // 6. TEST: kubectl get pods
    console.log('\n--- TEST 6: kubectl get pods ---');
    const getPodsOut = await sendAndCollectOutput(wsA, 'kubectl get pods');
    assert(getPodsOut.includes('NAME') && getPodsOut.includes('STATUS') && getPodsOut.includes('RESTARTS'), "Output Header Formatted", getPodsOut.split('\r\n')[0]);
    assert(getPodsOut.includes('CrashLoopBackOff'), 'Displays CrashLoopBackOff Pod Status');

    // 7. TEST: kubectl describe pod
    console.log('\n--- TEST 7: kubectl describe pod ---');
    const describeOut = await sendAndCollectOutput(wsA, 'kubectl describe pod web-app');
    assert(describeOut.includes('Namespace:') && describeOut.includes(labSessionA.namespace), 'Describe Contains Assigned Namespace');
    assert(describeOut.includes('State:          Waiting') && describeOut.includes('CrashLoopBackOff'), 'Describe Contains Waiting / CrashLoopBackOff State');
    assert(describeOut.includes('Exit Code:    1'), 'Describe Contains Exit Code 1');

    // 8. TEST: kubectl logs
    console.log('\n--- TEST 8: kubectl logs ---');
    const logsOut = await sendAndCollectOutput(wsA, 'kubectl logs web-app --previous');
    assert(logsOut.includes('FATAL') || logsOut.includes('exit code 1'), 'Logs Contain Application Startup Failure Trace');

    // 9. TEST: kubectl get events, deployments, services
    console.log('\n--- TEST 9: kubectl get events, deployments, services ---');
    const eventsOut = await sendAndCollectOutput(wsA, 'kubectl get events');
    assert(eventsOut.includes('LAST SEEN') && eventsOut.includes('BackOff'), "Command 'kubectl get events' Returns Warning Events");

    const deployOut = await sendAndCollectOutput(wsA, 'kubectl get deployments');
    assert(deployOut.includes('web-app'), "Command 'kubectl get deployments' Returns Deployment Resource");

    const svcOut = await sendAndCollectOutput(wsA, 'kubectl get services');
    assert(svcOut.includes('web-service'), "Command 'kubectl get services' Returns Service Resource");

    // 10. TEST: Security Enforcement (Cluster Scoped, All Namespaces, Cross-Namespace, Host Commands)
    console.log('\n--- TEST 10: Terminal Security Enforcement & RBAC ---');
    const allNsOut = await sendAndCollectOutput(wsA, 'kubectl get pods -A');
    assert(allNsOut.includes('Forbidden') && allNsOut.includes('all namespaces'), 'Block Flag -A (--all-namespaces) -> HTTP Forbidden');

    const otherNsOut = await sendAndCollectOutput(wsA, 'kubectl get pods -n kube-system');
    assert(otherNsOut.includes('Forbidden') && otherNsOut.includes('kube-system'), 'Block Cross-Namespace Access (-n kube-system) -> HTTP Forbidden');

    const nodesOut = await sendAndCollectOutput(wsA, 'kubectl get nodes');
    assert(nodesOut.includes('cluster-scoped resource and is strictly prohibited'), 'Block Cluster-Scoped Nodes -> Forbidden');

    const clusterRolesOut = await sendAndCollectOutput(wsA, 'kubectl get clusterroles');
    assert(clusterRolesOut.includes('cluster-scoped resource and is strictly prohibited'), 'Block Cluster-Scoped ClusterRoles -> Forbidden');

    const sudoOut = await sendAndCollectOutput(wsA, 'sudo rm -rf /');
    assert(sudoOut.includes('command not permitted in learner sandbox'), 'Block Dangerous Host Command (sudo rm -rf /) -> Blocked');

    const dockerOut = await sendAndCollectOutput(wsA, 'docker ps');
    assert(dockerOut.includes('command not permitted in learner sandbox'), 'Block Docker Socket Access -> Blocked');

    wsA.close();

    // 11. TEST: Scenario State Reflection for other failure scenarios
    console.log('\n--- TEST 11: Multi-Scenario Simulated Terminal Validation ---');
    const testScenarios = [
      { id: 'image-pull-backoff', expectedState: 'ImagePullBackOff' },
      { id: 'oom-killed', expectedState: 'OOMKilled' },
      { id: 'missing-configmap', expectedState: 'CreateContainerConfigError' },
      { id: 'service-connectivity', expectedState: 'web-service' },
    ];

    for (const sc of testScenarios) {
      await labService.startLab(userB._id, sc.id);
      const wsB = new WebSocket(`ws://localhost:${TEST_PORT}/ws/terminal?token=${tokenB}&labId=${sc.id}`);
      await new Promise((resolve) => wsB.on('open', resolve));

      // Wait for prompt
      await new Promise((res) => setTimeout(res, 200));

      const out = await sendAndCollectOutput(wsB, sc.id === 'service-connectivity' ? 'kubectl get services' : 'kubectl get pods');
      assert(out.includes(sc.expectedState), `Scenario '${sc.id}' Reflects State '${sc.expectedState}' in Terminal`);

      wsB.close();
    }

    // Cleanup
    console.log('\n--- Cleanup Test Resources ---');
    await Project.deleteMany({ owner: { $in: [userA._id, userB._id] } });
    await ProjectFile.deleteMany({ owner: { $in: [userA._id, userB._id] } });
    await DeploymentRecord.deleteMany({ user: { $in: [userA._id, userB._id] } });
    await ScenarioAttempt.deleteMany({ user: { $in: [userA._id, userB._id] } });
    await User.deleteMany({ _id: { $in: [userA._id, userB._id] } });
    console.log('✅ Cleaned up test database entities.\n');

  } catch (err) {
    console.error('Fatal Test Error:', err);
    failed++;
  } finally {
    if (server) {
      server.close();
    }
    await mongoose.disconnect();
    console.log('========================================================');
    console.log(`📊 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log('========================================================');
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTerminalTests();
