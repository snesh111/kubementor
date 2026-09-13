import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './src/models/User.js';
import Project from './src/models/Project.js';
import ProjectFile from './src/models/ProjectFile.js';
import DeploymentRecord from './src/models/DeploymentRecord.js';
import ScenarioAttempt from './src/models/ScenarioAttempt.js';
import ContextSnapshot from './src/models/ContextSnapshot.js';
import LabNote from './src/models/LabNote.js';
import labService from './src/services/labService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

let passed = 0;
let failed = 0;

const assert = (condition, message) => {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failed++;
  }
};

async function runTestSuite() {
  console.log('\n========================================================');
  console.log('🧪 STARTING PART 6: PERSISTENT SCRATCHPAD & NOTES TEST SUITE');
  console.log('========================================================\n');

  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kubementor');
    console.log('  [MongoDB] Connected successfully for testing\n');

    const timestamp = Date.now();
    const userA = await User.create({
      email: `learner_a_${timestamp}@kubementor.io`,
      name: 'Learner A',
      password: 'Password123!',
      isVerified: true,
    });

    const userB = await User.create({
      email: `learner_b_${timestamp}@kubementor.io`,
      name: 'Learner B',
      password: 'Password123!',
      isVerified: true,
    });

    console.log('--- SECTION 1: INITIALIZATION & RETRIEVAL ---');

    // Test 1: Query notes for unstarted lab throws 404
    try {
      await labService.getLabNotes(userA._id, 'crash-loop-backoff');
      assert(false, 'Should throw 404 when lab not started');
    } catch (err) {
      assert(err.statusCode === 404, 'Step 1: Notes query on unstarted lab throws 404');
    }

    // Test 2: Start lab for User A
    await labService.startLab(userA._id, 'crash-loop-backoff');
    const initialNotes = await labService.getLabNotes(userA._id, 'crash-loop-backoff');
    assert(initialNotes && initialNotes.labId === 'crash-loop-backoff', 'Step 2: Retrieved blank initial notes on lab start');
    assert(initialNotes.evidence === '' && initialNotes.hypothesis === '', 'Step 3: Initial notes fields are blank strings');

    console.log('\n--- SECTION 2: SAVING & PERSISTENCE ---');

    // Test 3: Save structured notes for User A
    const notesPayloadA = {
      evidence: 'Container restarts repeatedly. Exit code 1 logged on startup.',
      hypothesis: 'Startup command in deployment is invoking a non-zero exit command.',
      rootCause: 'Failing command string in container spec: sleep 2 && exit 1.',
      plannedFix: 'Remove the custom command from deployment.yaml to allow default nginx entrypoint.',
      result: 'Pending deployment of fix.',
      generalNotes: 'Observed with `kubectl describe pod` and `kubectl logs`.',
    };

    const savedNotes = await labService.saveLabNotes(userA._id, 'crash-loop-backoff', notesPayloadA);
    assert(savedNotes && savedNotes.evidence === notesPayloadA.evidence, 'Step 4: Successfully saved structured notes');
    assert(savedNotes.plannedFix === notesPayloadA.plannedFix, 'Step 5: Planned fix correctly stored');
    assert(savedNotes.lastSavedAt instanceof Date || typeof savedNotes.lastSavedAt === 'string', 'Step 6: lastSavedAt timestamp updated');

    // Test 4: Querying again returns the exact persisted notes
    const fetchedAgain = await labService.getLabNotes(userA._id, 'crash-loop-backoff');
    assert(fetchedAgain.evidence === notesPayloadA.evidence, 'Step 7: Persisted evidence matches across queries');
    assert(fetchedAgain.rootCause === notesPayloadA.rootCause, 'Step 8: Persisted root cause matches');
    assert(fetchedAgain.generalNotes === notesPayloadA.generalNotes, 'Step 9: Persisted general notes match');

    // Test 5: Updating existing notes updates in-place without duplicate
    const updatedPayload = {
      ...notesPayloadA,
      result: 'Deployment succeeded! Pod changed to Running state with 1/1 Ready.',
    };
    const updatedNotes = await labService.saveLabNotes(userA._id, 'crash-loop-backoff', updatedPayload);
    assert(updatedNotes.result === updatedPayload.result, 'Step 10: Result field successfully updated in-place');

    const totalNotesCountA = await LabNote.countDocuments({ user: userA._id, labId: 'crash-loop-backoff' });
    assert(totalNotesCountA === 1, 'Step 11: Exactly one LabNote document exists for user and lab (no duplicates)');

    console.log('\n--- SECTION 3: MULTI-TENANCY & LAB SCOPING ---');

    // Test 6: User B cannot access User A's notes (User B has not started lab)
    try {
      await labService.getLabNotes(userB._id, 'crash-loop-backoff');
      assert(false, 'User B should not access notes for unstarted lab');
    } catch (err) {
      assert(err.statusCode === 404, 'Step 12: User B query for unstarted lab rejected with 404');
    }

    // Test 7: User B starts the same lab and gets their own empty notes
    await labService.startLab(userB._id, 'crash-loop-backoff');
    const userBNotes = await labService.getLabNotes(userB._id, 'crash-loop-backoff');
    assert(userBNotes.evidence === '', 'Step 13: User B has independent blank notes (does not see User A notes)');

    // Test 8: User B saves their own notes
    await labService.saveLabNotes(userB._id, 'crash-loop-backoff', {
      evidence: 'User B observed a different symptom.',
    });

    const userARecheck = await labService.getLabNotes(userA._id, 'crash-loop-backoff');
    assert(userARecheck.evidence === notesPayloadA.evidence, 'Step 14: User A notes remained completely untouched by User B');

    // Test 9: User A starts a different lab (ImagePullBackOff) -> gets separate notes
    await labService.startLab(userA._id, 'image-pull-backoff');
    const imagePullNotes = await labService.getLabNotes(userA._id, 'image-pull-backoff');
    assert(imagePullNotes.evidence === '', 'Step 15: ImagePullBackOff notes start blank');

    await labService.saveLabNotes(userA._id, 'image-pull-backoff', {
      evidence: 'Failed to pull image nonexistent-tag.',
    });

    const crashLoopRecheck = await labService.getLabNotes(userA._id, 'crash-loop-backoff');
    assert(crashLoopRecheck.evidence === notesPayloadA.evidence, 'Step 16: CrashLoopBackOff notes preserved independently of ImagePullBackOff');

    console.log('\n--- SECTION 4: VALIDATION, SIZE LIMITS & SANITIZATION ---');

    // Test 10: Oversized payload rejected (>10,000 characters)
    try {
      const hugeText = 'A'.repeat(10001);
      await labService.saveLabNotes(userA._id, 'crash-loop-backoff', {
        evidence: hugeText,
      });
      assert(false, 'Oversized evidence text should be rejected');
    } catch (err) {
      assert(err.statusCode === 400 && err.message.includes('cannot exceed 10,000 characters'), `Step 17: Oversized evidence rejected: ${err.message}`);
    }

    // Test 11: Oversized general notes rejected (>20,000 characters)
    try {
      const hugeGeneralNotes = 'N'.repeat(20001);
      await labService.saveLabNotes(userA._id, 'crash-loop-backoff', {
        generalNotes: hugeGeneralNotes,
      });
      assert(false, 'Oversized general notes should be rejected');
    } catch (err) {
      assert(err.statusCode === 400 && err.message.includes('cannot exceed 20,000 characters'), `Step 18: Oversized general notes rejected: ${err.message}`);
    }

    // Test 12: XSS script payload is safely stored as literal text without execution
    const xssPayload = {
      evidence: '<script>alert("XSS Attack")</script><img src="x" onerror="alert(1)" />',
      hypothesis: 'Testing safety with HTML: <b>Bold</b>',
    };
    const xssSaved = await labService.saveLabNotes(userA._id, 'crash-loop-backoff', xssPayload);
    assert(xssSaved.evidence === xssPayload.evidence, 'Step 19: XSS payload stored safely as plain text literal');

    console.log('\n--- SECTION 5: RESET LAB COMPATIBILITY ---');

    // Test 13: Resetting the lab restores starter files & environment, but PRESERVES scratchpad notes
    const resetSession = await labService.resetLab(userA._id, 'crash-loop-backoff');
    assert(resetSession && resetSession.labId === 'crash-loop-backoff', 'Step 20: Lab reset executed');

    const notesAfterReset = await labService.getLabNotes(userA._id, 'crash-loop-backoff');
    assert(notesAfterReset && notesAfterReset.evidence === xssPayload.evidence, 'Step 21: Scratchpad notes PRESERVED after lab reset');
    assert(notesAfterReset.hypothesis === xssPayload.hypothesis, 'Step 22: Learning investigation history intact');

    console.log('\n========================================================');
    console.log(`📊 PART 6 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log('========================================================\n');

    // Cleanup test users and documents
    await User.deleteMany({ _id: { $in: [userA._id, userB._id] } });
    await Project.deleteMany({ owner: { $in: [userA._id, userB._id] } });
    await ProjectFile.deleteMany({ owner: { $in: [userA._id, userB._id] } });
    await DeploymentRecord.deleteMany({ user: { $in: [userA._id, userB._id] } });
    await ScenarioAttempt.deleteMany({ user: { $in: [userA._id, userB._id] } });
    await ContextSnapshot.deleteMany({ user: { $in: [userA._id, userB._id] } });
    await LabNote.deleteMany({ user: { $in: [userA._id, userB._id] } });

    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('\n❌ Unhandled Test Suite Exception:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

runTestSuite();
