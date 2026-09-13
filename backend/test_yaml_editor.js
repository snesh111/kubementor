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
import labService from './src/services/labService.js';
import { authService } from './src/services/authService.js';

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
  console.log('🧪 STARTING PART 5: YAML MANIFEST EDITOR & DEPLOYMENT TEST SUITE');
  console.log('========================================================\n');

  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kubementor');
    console.log('  [MongoDB] Connected successfully for testing\n');

    const timestamp = Date.now();
    const userAEmail = `learner_a_${timestamp}@kubementor.io`;
    const userBEmail = `learner_b_${timestamp}@kubementor.io`;

    const userA = await User.create({
      email: userAEmail,
      name: 'Learner A',
      password: 'Password123!',
      isVerified: true,
    });

    const userB = await User.create({
      email: userBEmail,
      name: 'Learner B',
      password: 'Password123!',
      isVerified: true,
    });

    console.log('--- SECTION 1: AUTHENTICATION & ACCESS ISOLATION ---');

    // Test 1: User A gets starter files without session -> 404
    try {
      await labService.getLabFiles(userA._id, 'crash-loop-backoff');
      assert(false, 'Should throw 404 if lab not started yet');
    } catch (err) {
      assert(err.statusCode === 404, 'Step 1: Lab files query on unstarted lab throws 404');
    }

    // Test 2: Start lab for User A
    const sessionA = await labService.startLab(userA._id, 'crash-loop-backoff');
    assert(sessionA && sessionA.labId === 'crash-loop-backoff', 'Step 2: User A started crash-loop-backoff lab');

    // Test 3: User A can fetch all lab files
    const filesA = await labService.getLabFiles(userA._id, 'crash-loop-backoff');
    assert(Array.isArray(filesA) && filesA.length >= 2, `Step 3: User A retrieved ${filesA.length} manifest files`);
    assert(filesA.some((f) => f.originalName === 'deployment.yaml'), 'Step 4: deployment.yaml is present in files list');

    // Test 4: User A can fetch single file by name
    const depFileA = await labService.getLabFileByName(userA._id, 'crash-loop-backoff', 'deployment.yaml');
    assert(depFileA && depFileA.originalName === 'deployment.yaml', 'Step 5: User A retrieved deployment.yaml by name');

    // Test 5: User B cannot access User A's files (User B has not started lab)
    try {
      await labService.getLabFiles(userB._id, 'crash-loop-backoff');
      assert(false, 'User B should not access files for unstarted lab');
    } catch (err) {
      assert(err.statusCode === 404, 'Step 6: User B cross-tenant file query rejected with 404');
    }

    // Test 6: User B cannot modify User A's file
    try {
      await labService.saveLabFile(userB._id, 'crash-loop-backoff', 'deployment.yaml', 'apiVersion: apps/v1\nkind: Deployment');
      assert(false, 'User B should not be able to save file to User A lab');
    } catch (err) {
      assert(err.statusCode === 404, 'Step 7: User B cannot modify User A files (HTTP 404)');
    }

    // Test 7: User B cannot deploy User A lab
    try {
      await labService.deployLab(userB._id, 'crash-loop-backoff');
      assert(false, 'User B should not be able to deploy User A lab');
    } catch (err) {
      assert(err.statusCode === 404, 'Step 8: User B cannot deploy User A lab (HTTP 404)');
    }

    console.log('\n--- SECTION 2: YAML SYNTAX & SECURITY VALIDATION ---');

    // Test 8: Malformed YAML is rejected with line error
    try {
      const badYaml = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  labels:
    app: [bad-syntax: unclosed bracket
spec:
  replicas: 1`;
      await labService.saveLabFile(userA._id, 'crash-loop-backoff', 'deployment.yaml', badYaml);
      assert(false, 'Malformed YAML should be rejected');
    } catch (err) {
      assert(err.statusCode === 400 && err.message.includes('Invalid YAML syntax'), `Step 9: Malformed YAML rejected: ${err.message}`);
    }

    // Test 9: Valid YAML save succeeds
    const validModifiedYaml = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  labels:
    app: web-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
    spec:
      containers:
      - name: nginx
        image: nginx:1.25.3
        command: ["/bin/sh", "-c", "echo Still crashing... && exit 1"]
        ports:
        - containerPort: 80`;
    const savedFile = await labService.saveLabFile(userA._id, 'crash-loop-backoff', 'deployment.yaml', validModifiedYaml);
    assert(savedFile && savedFile.originalName === 'deployment.yaml', 'Step 10: Valid YAML successfully saved to ProjectFile');

    // Test 10: Cluster-scoped resources rejected on deploy
    const clusterRoleYaml = `apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: cluster-admin-bypass
rules:
- apiGroups: ["*"]
  resources: ["*"]
  verbs: ["*"]`;
    await labService.saveLabFile(userA._id, 'crash-loop-backoff', 'clusterrole.yaml', clusterRoleYaml);

    try {
      await labService.deployLab(userA._id, 'crash-loop-backoff');
      assert(false, 'ClusterRole manifest should be blocked from sandbox deploy');
    } catch (err) {
      assert(err.statusCode === 400 && err.message.includes('Cluster-scoped resource'), `Step 11: Cluster-scoped resource blocked: ${err.message}`);
    }

    // Clean up clusterrole.yaml
    await ProjectFile.deleteOne({ originalName: 'clusterrole.yaml' });

    // Test 11: Cross-namespace deployment rejected
    const crossNsYaml = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  namespace: kube-system
  labels:
    app: web-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
    spec:
      containers:
      - name: nginx
        image: nginx:1.25.3`;
    await labService.saveLabFile(userA._id, 'crash-loop-backoff', 'deployment.yaml', crossNsYaml);

    try {
      await labService.deployLab(userA._id, 'crash-loop-backoff');
      assert(false, 'Explicit other namespace should be rejected');
    } catch (err) {
      assert(err.statusCode === 400 && err.message.includes('Explicit namespace'), `Step 12: Cross-namespace deploy rejected: ${err.message}`);
    }

    console.log('\n--- SECTION 3: SCENARIO-AWARE DEPLOYMENT & OBSERVATION ---');

    // Scenario 1: CrashLoopBackOff - Wrong fix vs Correct fix
    console.log('\n[Scenario 1: CrashLoopBackOff]');
    const wrongFixCrash = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  labels:
    app: web-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
    spec:
      containers:
      - name: nginx
        image: nginx:1.25.3
        command: ["/bin/sh", "-c", "echo still crashing && exit 1"]
        ports:
        - containerPort: 80`;
    await labService.saveLabFile(userA._id, 'crash-loop-backoff', 'deployment.yaml', wrongFixCrash);
    const deployWrongCrash = await labService.deployLab(userA._id, 'crash-loop-backoff');
    assert(deployWrongCrash.status === 'still_failing', 'Step 13: CrashLoopBackOff wrong fix -> status is still_failing');
    assert(deployWrongCrash.observedFailure === 'crash-loop-backoff', 'Step 14: Observed failure persists as crash-loop-backoff');

    const correctFixCrash = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  labels:
    app: web-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
    spec:
      containers:
      - name: nginx
        image: nginx:1.25.3
        ports:
        - containerPort: 80`;
    await labService.saveLabFile(userA._id, 'crash-loop-backoff', 'deployment.yaml', correctFixCrash);
    const deployCorrectCrash = await labService.deployLab(userA._id, 'crash-loop-backoff');
    assert(deployCorrectCrash.status === 'fixed', 'Step 15: CrashLoopBackOff correct fix -> status is fixed');
    assert(deployCorrectCrash.observedFailure === null, 'Step 16: Observed failure cleared (null)');

    // Scenario 2: ImagePullBackOff
    console.log('\n[Scenario 2: ImagePullBackOff]');
    await labService.startLab(userA._id, 'image-pull-backoff');
    const wrongFixPull = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  labels:
    app: web-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
    spec:
      containers:
      - name: nginx
        image: nginx:nonexistent-tag-v99
        ports:
        - containerPort: 80`;
    await labService.saveLabFile(userA._id, 'image-pull-backoff', 'deployment.yaml', wrongFixPull);
    const deployWrongPull = await labService.deployLab(userA._id, 'image-pull-backoff');
    assert(deployWrongPull.status === 'still_failing', 'Step 17: ImagePullBackOff wrong fix -> status is still_failing');

    const correctFixPull = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  labels:
    app: web-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
    spec:
      containers:
      - name: nginx
        image: nginx:1.25.3
        ports:
        - containerPort: 80`;
    await labService.saveLabFile(userA._id, 'image-pull-backoff', 'deployment.yaml', correctFixPull);
    const deployCorrectPull = await labService.deployLab(userA._id, 'image-pull-backoff');
    assert(deployCorrectPull.status === 'fixed', 'Step 18: ImagePullBackOff correct fix -> status is fixed');

    // Scenario 3: OOMKilled
    console.log('\n[Scenario 3: OOMKilled]');
    await labService.startLab(userA._id, 'oom-killed');
    const wrongFixOOM = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  labels:
    app: web-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
    spec:
      containers:
      - name: nginx
        image: nginx:1.25.3
        resources:
          limits:
            memory: "16Mi"`;
    await labService.saveLabFile(userA._id, 'oom-killed', 'deployment.yaml', wrongFixOOM);
    const deployWrongOOM = await labService.deployLab(userA._id, 'oom-killed');
    assert(deployWrongOOM.status === 'still_failing', 'Step 19: OOMKilled wrong fix (16Mi) -> status is still_failing');

    const correctFixOOM = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  labels:
    app: web-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
    spec:
      containers:
      - name: nginx
        image: nginx:1.25.3
        resources:
          limits:
            memory: "512Mi"
            cpu: "500m"
          requests:
            memory: "64Mi"
            cpu: "100m"`;
    await labService.saveLabFile(userA._id, 'oom-killed', 'deployment.yaml', correctFixOOM);
    const deployCorrectOOM = await labService.deployLab(userA._id, 'oom-killed');
    assert(deployCorrectOOM.status === 'fixed', 'Step 20: OOMKilled correct fix (512Mi) -> status is fixed');

    // Scenario 4: Missing ConfigMap
    console.log('\n[Scenario 4: Missing ConfigMap]');
    await labService.startLab(userA._id, 'missing-configmap');
    await ProjectFile.deleteOne({ originalName: 'configmap.yaml', owner: userA._id });
    const deployNoConfig = await labService.deployLab(userA._id, 'missing-configmap');
    assert(deployNoConfig.status === 'still_failing', 'Step 21: Missing ConfigMap without ConfigMap -> still_failing');

    const configMapYaml = `apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  APP_ENV: "production"`;
    await labService.saveLabFile(userA._id, 'missing-configmap', 'configmap.yaml', configMapYaml);
    const deployWithConfig = await labService.deployLab(userA._id, 'missing-configmap');
    assert(deployWithConfig.status === 'fixed', 'Step 22: Missing ConfigMap created -> status is fixed');

    // Scenario 5: Service Connectivity
    console.log('\n[Scenario 5: Service Connectivity]');
    await labService.startLab(userA._id, 'service-connectivity');
    const wrongSvcYaml = `apiVersion: v1
kind: Service
metadata:
  name: web-service
  labels:
    app: web-app
spec:
  type: ClusterIP
  selector:
    app: still-mismatched-selector
  ports:
  - port: 80
    targetPort: 80`;
    await labService.saveLabFile(userA._id, 'service-connectivity', 'service.yaml', wrongSvcYaml);
    const deployWrongSvc = await labService.deployLab(userA._id, 'service-connectivity');
    assert(deployWrongSvc.status === 'still_failing', 'Step 23: Service label mismatch -> status is still_failing');

    const correctSvcYaml = `apiVersion: v1
kind: Service
metadata:
  name: web-service
  labels:
    app: web-app
spec:
  type: ClusterIP
  selector:
    app: web-app
  ports:
  - port: 80
    targetPort: 80`;
    await labService.saveLabFile(userA._id, 'service-connectivity', 'service.yaml', correctSvcYaml);
    const deployCorrectSvc = await labService.deployLab(userA._id, 'service-connectivity');
    assert(deployCorrectSvc.status === 'fixed', 'Step 24: Service label matched -> status is fixed');

    // Scenario 6: Ingress / TLS Failure
    console.log('\n[Scenario 6: Ingress/TLS Failure]');
    await labService.startLab(userA._id, 'ingress-tls-failure');
    const wrongIngressYaml = `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web-ingress
spec:
  rules:
  - host: app.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web-service
            port:
              number: 80
  tls:
  - hosts:
    - app.example.com
    secretName: nonexistent-tls-secret-failure`;
    await labService.saveLabFile(userA._id, 'ingress-tls-failure', 'ingress.yaml', wrongIngressYaml);
    const deployWrongIng = await labService.deployLab(userA._id, 'ingress-tls-failure');
    assert(deployWrongIng.status === 'still_failing', 'Step 25: Ingress TLS bad secret -> status is still_failing');

    const correctIngressYaml = `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web-ingress
spec:
  rules:
  - host: app.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web-service
            port:
              number: 80
  tls:
  - hosts:
    - app.example.com
    secretName: example-tls-secret`;
    await labService.saveLabFile(userA._id, 'ingress-tls-failure', 'ingress.yaml', correctIngressYaml);
    const deployCorrectIng = await labService.deployLab(userA._id, 'ingress-tls-failure');
    assert(deployCorrectIng.status === 'fixed', 'Step 26: Ingress TLS secret matched -> status is fixed');

    console.log('\n--- SECTION 4: RESET LAB COMPATIBILITY ---');

    // Test 12: Reset Lab restores starter files and initial failure state
    const resetSession = await labService.resetLab(userA._id, 'crash-loop-backoff');
    assert(resetSession && resetSession.labId === 'crash-loop-backoff', 'Step 27: Lab reset executed cleanly');

    const filesAfterReset = await labService.getLabFiles(userA._id, 'crash-loop-backoff');
    const depAfterReset = filesAfterReset.find((f) => f.originalName === 'deployment.yaml');
    assert(depAfterReset && depAfterReset.content.includes('exit 1'), 'Step 28: deployment.yaml content restored to initial failing state');

    // Attempt should be active with fixApplied cleared
    const attemptAfterReset = await ScenarioAttempt.findOne({
      user: userA._id,
      scenarioId: 'crash-loop-backoff',
    }).sort({ createdAt: -1 });
    assert(attemptAfterReset && !attemptAfterReset.restorationDetails?.fixApplied, 'Step 29: ScenarioAttempt restorationDetails cleared back to failing');

    // Re-deploying restored manifests confirms status is still_failing
    const deployAfterReset = await labService.deployLab(userA._id, 'crash-loop-backoff');
    assert(deployAfterReset.status === 'still_failing', 'Step 30: Freshly reset lab deployment confirms still_failing state');

    console.log('\n========================================================');
    console.log(`📊 PART 5 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log('========================================================\n');

    // Cleanup test users
    await User.deleteMany({ _id: { $in: [userA._id, userB._id] } });
    await Project.deleteMany({ owner: { $in: [userA._id, userB._id] } });
    await ProjectFile.deleteMany({ owner: { $in: [userA._id, userB._id] } });
    await DeploymentRecord.deleteMany({ user: { $in: [userA._id, userB._id] } });
    await ScenarioAttempt.deleteMany({ user: { $in: [userA._id, userB._id] } });
    await ContextSnapshot.deleteMany({ user: { $in: [userA._id, userB._id] } });

    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('\n❌ Unhandled Test Suite Exception:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

runTestSuite();
