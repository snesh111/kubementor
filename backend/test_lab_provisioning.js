import mongoose from 'mongoose';
import User from './src/models/User.js';
import Project from './src/models/Project.js';
import DeploymentRecord from './src/models/DeploymentRecord.js';
import ScenarioAttempt from './src/models/ScenarioAttempt.js';
import ContextSnapshot from './src/models/ContextSnapshot.js';
import ProjectFile from './src/models/ProjectFile.js';
import labService from './src/services/labService.js';
import k8sClientWrapper from './src/kubernetes/k8sClient.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/kubementor';

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

async function runLabProvisioningTests() {
  console.log('========================================================');
  console.log('🧪 STARTING PART 3 LAB PROVISIONING TEST SUITE');
  console.log('========================================================\n');

  try {
    await mongoose.connect(MONGO_URI);
    console.log('[MongoDB] Connected successfully for testing\n');

    // Setup Test Users
    const suffix = Date.now().toString().slice(-4);
    const userA = await User.create({
      name: `Learner Alice ${suffix}`,
      email: `alice_${suffix}@test.com`,
      password: 'Password123!',
      role: 'learner',
    });

    const userB = await User.create({
      name: `Learner Bob ${suffix}`,
      email: `bob_${suffix}@test.com`,
      password: 'Password123!',
      role: 'learner',
    });

    console.log(`[Setup] Created Test Users: Alice (${userA._id}) & Bob (${userB._id})\n`);

    // 1. TEST START LAB: CrashLoopBackOff
    console.log('--- TEST 1: Start Lab (CrashLoopBackOff) ---');
    const session1 = await labService.startLab(userA._id, 'crash-loop-backoff');
    assert(session1 && session1.labId === 'crash-loop-backoff', 'Lab Session Returned for CrashLoopBackOff');
    assert(session1.internalProjectId, 'Internal Project Created', `Project ID: ${session1.internalProjectId}`);
    assert(session1.attemptId, 'Scenario Attempt Created', `Attempt ID: ${session1.attemptId}`);
    assert(session1.namespace && session1.namespace.startsWith('kubementor-'), 'Isolated Namespace Assigned', session1.namespace);
    assert(session1.mode === 'simulation' || session1.mode === 'kubernetes', 'Environment Mode Accurately Reported', `Mode: ${session1.mode}`);
    assert(session1.starterFiles && session1.starterFiles.length >= 2, 'Starter Files Generated', `${session1.starterFiles.length} files`);
    assert(session1.concept && session1.concept.whatIsIt, 'Scenario Concept Metadata Included');
    assert(session1.mission && session1.mission.expectedFailure === 'CrashLoopBackOff', 'Mission Briefing Included');

    // 2. TEST GET ACTIVE SESSION
    console.log('\n--- TEST 2: Get Active Lab Session ---');
    const sessionGet = await labService.getLabSession(userA._id, 'crash-loop-backoff');
    assert(sessionGet && sessionGet.attemptId.toString() === session1.attemptId.toString(), 'Active Session Retrieved for User A');
    assert(sessionGet.resumed === true, 'Session Identified as Active/Resumed');

    // 3. TEST IDEMPOTENCY: Start same lab again (re-uses existing project without redundant duplicates)
    console.log('\n--- TEST 3: Idempotent Lab Start ---');
    const sessionStartAgain = await labService.startLab(userA._id, 'crash-loop-backoff');
    assert(
      sessionStartAgain.internalProjectId.toString() === session1.internalProjectId.toString(),
      'Same Internal Project Reused on Repeated Start',
      `Project ID: ${sessionStartAgain.internalProjectId}`
    );
    const userAProjects = await Project.countDocuments({ owner: userA._id, isLabInternal: true, labId: 'crash-loop-backoff' });
    assert(userAProjects === 1, 'No Redundant Duplicate Projects Created in DB', `Count: ${userAProjects}`);

    // 4. TEST RESET LAB
    console.log('\n--- TEST 4: Reset Lab Environment ---');
    const sessionReset = await labService.resetLab(userA._id, 'crash-loop-backoff');
    assert(sessionReset && sessionReset.labId === 'crash-loop-backoff', 'Lab Reset Successfully');
    assert(sessionReset.internalProjectId.toString() === session1.internalProjectId.toString(), 'Reset Maintains Same Project Workspace');
    assert(sessionReset.initialStatus === 'active' || sessionReset.initialStatus === 'preparing', 'Scenario Re-injected to Failure State');

    // 5. TEST USER ISOLATION (User B vs User A)
    console.log('\n--- TEST 5: User Isolation & Security ---');
    try {
      await labService.getLabSession(userB._id, 'crash-loop-backoff');
      assert(false, 'User B Cannot Access User A Lab Session (Expected 404)');
    } catch (err) {
      assert(err.statusCode === 404 || err.status === 404, 'User B Session Lookup Fails (Isolated)', `HTTP ${err.statusCode || 404}`);
    }

    // Bob starts his own lab
    const sessionBob = await labService.startLab(userB._id, 'crash-loop-backoff');
    assert(sessionBob.internalProjectId.toString() !== session1.internalProjectId.toString(), 'User B Gets Completely Distinct Internal Project');
    assert(sessionBob.namespace !== session1.namespace, 'User B Gets Completely Distinct Isolated Namespace', `Bob: ${sessionBob.namespace} vs Alice: ${session1.namespace}`);

    // 6. TEST ALL 6 SCENARIOS
    console.log('\n--- TEST 6: Provisioning All 6 Failure Scenarios ---');
    const allScenarios = [
      'crash-loop-backoff',
      'image-pull-backoff',
      'oom-killed',
      'missing-configmap',
      'service-connectivity',
      'ingress-tls-failure',
    ];

    for (const scId of allScenarios) {
      const scSession = await labService.startLab(userA._id, scId);
      assert(
        scSession && scSession.labId === scId,
        `Scenario '${scId}' Provisioned Successfully`,
        `Expected Failure: ${scSession.mission?.expectedFailure || 'Verified'}`
      );
    }

    // 7. TEST INVALID LAB ID
    console.log('\n--- TEST 7: Invalid Lab ID Error Handling ---');
    try {
      await labService.startLab(userA._id, 'non-existent-fake-scenario');
      assert(false, 'Invalid Scenario ID Should Throw 404');
    } catch (err) {
      assert(err.statusCode === 404 || err.status === 404, 'Invalid Scenario Returns 404 Not Found');
    }

    // CLEANUP
    console.log('\n--- Cleanup Test Resources ---');
    await Project.deleteMany({ owner: { $in: [userA._id, userB._id] } });
    await ProjectFile.deleteMany({ owner: { $in: [userA._id, userB._id] } });
    await DeploymentRecord.deleteMany({ user: { $in: [userA._id, userB._id] } });
    await ScenarioAttempt.deleteMany({ user: { $in: [userA._id, userB._id] } });
    await ContextSnapshot.deleteMany({ user: { $in: [userA._id, userB._id] } });
    await User.deleteMany({ _id: { $in: [userA._id, userB._id] } });
    console.log('✅ Cleaned up test database entities.\n');

  } catch (err) {
    console.error('Fatal Test Error:', err);
    failed++;
  } finally {
    await mongoose.disconnect();
    console.log('========================================================');
    console.log(`📊 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log('========================================================');
    process.exit(failed > 0 ? 1 : 0);
  }
}

runLabProvisioningTests();
