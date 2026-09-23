// Complete scenario step data with simple explanations, real-world examples, interactive quizzes, and validation checklists

export const SCENARIO_STEPS_DATA = {
  'crash-loop-backoff': {
    code: '01',
    scenarioId: 'crash-loop-backoff',
    name: 'CrashLoopBackOff',
    category: 'Reliability',
    difficulty: 'Beginner',
    summary: 'Container repeatedly exits with non-zero status upon starting.',
    steps: [
      {
        id: 'intro',
        type: 'LESSON',
        title: 'What is CrashLoopBackOff',
        subtitle: 'Understanding why containers fail and restart repeatedly',
        concept: 'CrashLoopBackOff is a pod state indicating that a container in the pod starts, crashes (terminates with an error), and restarts. To prevent node CPU exhaustion from rapid infinite crashes, Kubelet waits with an increasing exponential back-off delay (10s, 20s, 40s, up to 5 minutes) between restart attempts.',
        flow: [
          { label: 'KUBELET', sub: 'Starts Container', color: 'emerald' },
          { label: 'PROCESS', sub: 'Exit Code 1 / Error', color: 'rose' },
          { label: 'BACK-OFF', sub: 'Delay (10s - 5m)', color: 'amber' },
        ],
        keyTakeaways: [
          'CrashLoopBackOff is NOT the error itself—it is the symptom of a process crashing inside the container.',
          'The pod never reaches the Ready (1/1) state, meaning it cannot receive user traffic.',
          'Common causes include missing environment variables, bad startup commands, or unhandled exceptions in code.',
        ],
      },
      {
        id: 'diagnostics',
        type: 'DIAGNOSTICS',
        title: 'Inspect Pods & Exit Codes',
        subtitle: 'Essential CLI commands to find the exact root cause',
        explanation: 'When diagnosing a crashing pod, your first goal is to find the exit code and read the crash logs from the previous failed run.',
        commands: [
          {
            cmd: 'kubectl get pods',
            desc: 'Check pod status, readiness (0/1), and restart counter (e.g., Restarts: 4).',
          },
          {
            cmd: 'kubectl describe pod web-app',
            desc: 'View container State (Waiting: CrashLoopBackOff), Last State (Terminated with Exit Code 1), and warning Events.',
          },
          {
            cmd: 'kubectl logs web-app --previous',
            desc: 'Read the logs from the previous container instance before it crashed (crucial since new container has empty logs).',
          },
          {
            cmd: 'kubectl get events --sort-by=.metadata.creationTimestamp',
            desc: 'See a chronological timeline of warning events emitted by the Kubelet node agent.',
          },
        ],
        exampleOutput: {
          title: 'Sample kubectl describe pod output:',
          code: `Containers:
  web-app:
    State:          Waiting
      Reason:       CrashLoopBackOff
    Last State:     Terminated
      Reason:       Error
      Exit Code:    1
      Started:      Sat, 20 Sep 2026 10:14:02 +0000
      Finished:     Sat, 20 Sep 2026 10:14:03 +0000
    Restart Count:  3`,
        },
      },
      {
        id: 'deepdive',
        type: 'LESSON',
        title: 'Container Lifecycle & Bad Commands',
        subtitle: 'Why short-lived commands break Kubernetes deployments',
        explanation: 'Kubernetes Deployments are designed for long-running services (like web servers or daemons). If a container runs a command that finishes immediately (like echo "done" or exit 1), Kubelet thinks the process died unexpectedly and restarts it.',
        comparison: {
          badTitle: 'Broken Deployment YAML (Causes CrashLoop)',
          badCode: `spec:
  containers:
  - name: web-app
    image: nginx:1.25-alpine
    # BAD: This command exits immediately with error!
    command: ["sh", "-c", "echo 'Booting...' && exit 1"]`,
          badReason: 'Process exits with code 1 after 1 second. Kubelet detects exit and triggers CrashLoopBackOff.',
          goodTitle: 'Fixed Deployment YAML (Runs in Foreground)',
          goodCode: `spec:
  containers:
  - name: web-app
    image: nginx:1.25-alpine
    # GOOD: Runs daemon in foreground (PID 1)
    command: ["nginx", "-g", "daemon off;"]`,
          goodReason: 'Nginx process stays alive in foreground (PID 1) listening for HTTP requests. Pod stays 1/1 Ready.',
        },
      },
      {
        id: 'task',
        type: 'TASK',
        title: 'Fix Entrypoint & Environment',
        subtitle: 'Hands-on task to repair the failing workload',
        instruction: 'Your live practice cluster has a deployment named "web-app" that is crashing. Investigate the pod, correct the container command/args, and restore the service to a healthy Running state.',
        stepsToComplete: [
          '1. Run `kubectl get pods` in the terminal to verify the CrashLoopBackOff state.',
          '2. Run `kubectl logs web-app --previous` or `kubectl describe pod web-app` to inspect the exit reason.',
          '3. Switch to the YAML Editor tab on the right or use `kubectl edit deployment web-app`.',
          '4. Remove the broken `exit 1` or failing command and ensure the container runs a valid server process.',
          '5. Apply the manifest and verify `kubectl get pods` shows `1/1 Running`.',
        ],
        actionHint: 'Tip: You can switch between the Terminal and YAML Editor tabs on the top right at any time!',
      },
      {
        id: 'quiz',
        type: 'QUIZ',
        title: 'Diagnose Application Restart',
        subtitle: 'Test your understanding of container crash troubleshooting',
        question: 'Why does running "kubectl logs <pod-name>" sometimes show empty output for a CrashLoopBackOff pod?',
        options: [
          'Kubernetes automatically deletes all container logs after 3 restarts.',
          'The newly restarted container just booted and has not printed any output yet; you must use "--previous" to see the crashed instance logs.',
          'Logs are only stored if the pod is in Ready 1/1 state.',
          'The container engine does not capture logs from non-root user processes.',
        ],
        correctIndex: 1,
        explanation: 'When a container crashes and restarts, Kubernetes starts a fresh container with an empty stdout/stderr buffer. The "--previous" flag tells Kubelet to fetch the logs from the previous terminated container instance.',
      },
      {
        id: 'validation',
        type: 'VALIDATION',
        title: 'Validate 1/1 Running State',
        subtitle: 'Automated verification check of your cluster state',
        explanation: 'Once you have applied your fix, run the validation check below. The automated evaluator will verify pod health, ready probes, and zero crash loops in your tenant namespace.',
        requirements: [
          'Pod "web-app" must be in phase "Running".',
          'Container must report Ready condition: True (1/1).',
          'No CrashLoopBackOff or Error events within the last 60 seconds.',
          'Pod responds successfully to health probes.',
        ],
      },
    ],
  },

  'image-pull-backoff': {
    code: '02',
    scenarioId: 'image-pull-backoff',
    name: 'ImagePullBackOff',
    category: 'Reliability',
    difficulty: 'Beginner',
    summary: 'Container image registry download fails due to invalid image tag.',
    steps: [
      {
        id: 'intro',
        type: 'LESSON',
        title: 'What is ImagePullBackOff',
        subtitle: 'Why Kubernetes cannot download the requested container image',
        concept: 'ImagePullBackOff means Kubernetes Kubelet attempted to download (pull) the container image specified in your pod manifest from a container registry (like Docker Hub, ECR, GCR, or Quay), but the download failed. Kubelet waits with an increasing exponential back-off delay before retrying.',
        flow: [
          { label: 'KUBELET', sub: 'Pulls Image', color: 'emerald' },
          { label: 'REGISTRY', sub: '404 Not Found / Typo', color: 'rose' },
          { label: 'BACK-OFF', sub: 'Retry (10s - 5m)', color: 'amber' },
        ],
        keyTakeaways: [
          'ErrImagePull is the initial failure when attempting to download.',
          'ImagePullBackOff is the waiting state before Kubelet tries downloading again.',
          'Most common cause: Typo in the image tag or image repository name.',
        ],
      },
      {
        id: 'diagnostics',
        type: 'DIAGNOSTICS',
        title: 'Check Image Tag & Registry',
        subtitle: 'How to find the exact registry error in pod events',
        explanation: 'Container pull errors are recorded directly in the pod warning events. Running `kubectl describe pod` will show the exact HTTP response code or manifest error from the registry.',
        commands: [
          {
            cmd: 'kubectl get pods',
            desc: 'Check pod status (will show "ImagePullBackOff" or "ErrImagePull").',
          },
          {
            cmd: 'kubectl describe pod web-app',
            desc: 'Scroll down to "Events" to see the exact image name Kubelet tried to pull and the registry error.',
          },
          {
            cmd: 'kubectl get pod web-app -o jsonpath="{.spec.containers[*].image}"',
            desc: 'Extract just the image string configured in the pod specification.',
          },
          {
            cmd: 'kubectl get events --field-selector reason=Failed',
            desc: 'Filter all failure events across the current namespace.',
          },
        ],
        exampleOutput: {
          title: 'Sample Event from kubectl describe pod:',
          code: `Events:
  Type     Reason     Age                From               Message
  ----     ------     ----               ----               -------
  Normal   Pulling    2m (x3 over 3m)    kubelet            Pulling image "nginx:1.999.0"
  Warning  Failed     2m (x3 over 3m)    kubelet            Failed to pull image "nginx:1.999.0": rpc error: code = NotFound desc = failed to pull and unpack image: manifest unknown
  Warning  Failed     2m (x3 over 3m)    kubelet            Error: ErrImagePull
  Normal   BackOff    15s (x6 over 3m)   kubelet            Back-off pulling image "nginx:1.999.0"
  Warning  Failed     15s (x6 over 3m)   kubelet            Error: ImagePullBackOff`,
        },
      },
      {
        id: 'deepdive',
        type: 'LESSON',
        title: 'ErrImagePull vs ImagePullBackOff',
        subtitle: 'Understanding the difference and fixing manifest typos',
        explanation: 'ErrImagePull is the immediate error when the network request fails. ImagePullBackOff is the delayed retry loop. Let\'s see what a broken manifest looks like compared to a fixed one.',
        comparison: {
          badTitle: 'Broken Deployment YAML (Non-existent Image Tag)',
          badCode: `spec:
  containers:
  - name: web-app
    # BAD: Tag 1.999.0 does not exist on Docker Hub!
    image: nginx:1.999.0
    imagePullPolicy: IfNotPresent`,
          badReason: 'Registry returns "manifest unknown" (404) because nginx:1.999.0 does not exist. Kubelet fails to start the container.',
          goodTitle: 'Fixed Deployment YAML (Valid Verified Tag)',
          goodCode: `spec:
  containers:
  - name: web-app
    # GOOD: Tag 1.25-alpine is a valid, lightweight release
    image: nginx:1.25-alpine
    imagePullPolicy: IfNotPresent`,
          goodReason: 'Image pulls successfully from registry in under 2 seconds. Container starts and reaches 1/1 Ready.',
        },
      },
      {
        id: 'task',
        type: 'TASK',
        title: 'Update Container Image in YAML',
        subtitle: 'Fix the image tag and deploy the updated manifest',
        instruction: 'The practice deployment "web-app" is configured with an invalid image tag. Inspect the pod events, find the typo, update the image tag to a valid image (e.g. `nginx:1.25-alpine`), and apply the fix.',
        stepsToComplete: [
          '1. In the Terminal, run `kubectl describe pod web-app` and check the Events section at the bottom.',
          '2. Identify the invalid image string (e.g., `nginx:1.999.0` or misspelled repository).',
          '3. Switch to the YAML Editor tab or use `kubectl set image deployment/web-app web-app=nginx:1.25-alpine`.',
          '4. Alternatively, edit the image field in the YAML Editor and click "Apply to Cluster".',
          '5. Run `kubectl get pods` to verify the pod successfully pulls the image and enters `Running (1/1)`.',
        ],
        actionHint: 'Tip: Click the YAML Editor tab on the top right to view and edit the live manifest directly!',
      },
      {
        id: 'quiz',
        type: 'QUIZ',
        title: 'Analyze Image Pull Events',
        subtitle: 'Test your Kubernetes image resolution knowledge',
        question: 'What is the most likely cause if a private registry returns "401 Unauthorized" or "pull access denied" during image pull?',
        options: [
          'The Kubernetes node has run out of disk space in /var/lib/docker.',
          'The pod spec is missing a valid "imagePullSecrets" secret reference with registry credentials.',
          'The container port is already occupied by another pod.',
          'The Kubernetes cluster version is incompatible with the container image architecture.',
        ],
        correctIndex: 1,
        explanation: 'Private registries require authentication credentials. If the pod spec does not reference a valid docker-registry Secret via "spec.imagePullSecrets", the registry rejects the pull with 401 Unauthorized or pull access denied.',
      },
      {
        id: 'validation',
        type: 'VALIDATION',
        title: 'Validate Image Pull & Start',
        subtitle: 'Run the automated solution check',
        explanation: 'When your pod is running and ready, click the button below to validate your solution against the cluster.',
        requirements: [
          'Pod image is updated to a valid, pullable container image.',
          'Pod phase is "Running" and Ready condition is True (1/1).',
          'No ErrImagePull or ImagePullBackOff events.',
          'Cluster container status is clean and healthy.',
        ],
      },
    ],
  },

  'oom-killed': {
    code: '03',
    scenarioId: 'oom-killed',
    name: 'OOMKilled Container',
    category: 'Performance',
    difficulty: 'Intermediate',
    summary: 'Container process is terminated by Linux kernel due to memory limit exhaustion.',
    steps: [
      {
        id: 'intro',
        type: 'LESSON',
        title: 'What is OOMKilled (Exit 137)',
        subtitle: 'Understanding Linux cgroup memory limits in Kubernetes',
        concept: 'OOMKilled (Out Of Memory Killed, exit code 137) occurs when a container attempts to allocate more RAM than allowed by its `resources.limits.memory` limit. The Linux kernel Out-Of-Memory Killer (oom_killer) instantly sends SIGKILL (kill -9) to terminate the container process.',
        flow: [
          { label: 'APP RAM', sub: 'Exceeds Memory Limit', color: 'amber' },
          { label: 'KERNEL', sub: 'oom_killer SIGKILL', color: 'rose' },
          { label: 'EXIT 137', sub: 'OOMKilled Status', color: 'rose' },
        ],
        keyTakeaways: [
          'Exit Code 137 = 128 + 9 (SIGKILL signal sent by the Linux kernel).',
          'OOMKilled processes terminate instantly without running graceful shutdown handlers.',
          'Can be caused by unrealistically low limits or memory leaks in application code.',
        ],
      },
      {
        id: 'diagnostics',
        type: 'DIAGNOSTICS',
        title: 'Inspect Memory Limits & Logs',
        subtitle: 'How to verify exit code 137 and OOMKilled status',
        explanation: 'Look for the OOMKilled flag in `kubectl describe pod` under the Last State section.',
        commands: [
          {
            cmd: 'kubectl get pods',
            desc: 'Check pod restart count and status (often transitions between CrashLoopBackOff and Error).',
          },
          {
            cmd: 'kubectl describe pod web-app',
            desc: 'Look under "Last State: Terminated" for "Reason: OOMKilled" and "Exit Code: 137".',
          },
          {
            cmd: 'kubectl top pod web-app',
            desc: 'View current CPU and RAM consumption in MiB (if metrics server is enabled).',
          },
          {
            cmd: 'kubectl get deployment web-app -o yaml',
            desc: 'Inspect current resource requests and limits in the deployment specification.',
          },
        ],
        exampleOutput: {
          title: 'Sample Last State from kubectl describe pod:',
          code: `Containers:
  web-app:
    State:          Waiting
      Reason:       CrashLoopBackOff
    Last State:     Terminated
      Reason:       OOMKilled
      Exit Code:    137
      Started:      Sat, 20 Sep 2026 10:20:11 +0000
      Finished:     Sat, 20 Sep 2026 10:20:14 +0000`,
        },
      },
      {
        id: 'deepdive',
        type: 'LESSON',
        title: 'Kubernetes QoS Classes & Memory Limits',
        subtitle: 'Configuring proper memory requests and limits with safety headroom',
        explanation: 'If limits are set too tight (e.g., 16Mi for a web app that requires 64Mi during startup), the container will be killed before it even finishes booting.',
        comparison: {
          badTitle: 'Broken Resource Spec (Memory Limit Too Low)',
          badCode: `spec:
  containers:
  - name: web-app
    image: nginx:1.25-alpine
    resources:
      limits:
        memory: "8Mi"   # WAY too small! Web server needs ~32Mi
        cpu: "100m"`,
          badReason: 'Process memory usage immediately exceeds 8Mi limit on boot, triggering kernel OOMKilled (Exit 137).',
          goodTitle: 'Sized Resource Spec (With Headroom)',
          goodCode: `spec:
  containers:
  - name: web-app
    image: nginx:1.25-alpine
    resources:
      requests:
        memory: "64Mi"  # Guaranteed allocation for scheduling
        cpu: "50m"
      limits:
        memory: "256Mi" # Burst ceiling with 4x buffer
        cpu: "200m"`,
          goodReason: 'Container has ample memory during startup and traffic spikes, remaining stable and healthy.',
        },
      },
      {
        id: 'task',
        type: 'TASK',
        title: 'Tune Container Memory Limits',
        subtitle: 'Increase memory limits in the deployment manifest',
        instruction: 'The web-app deployment is constantly getting OOMKilled because its memory limit is constrained. Increase `resources.limits.memory` to `256Mi` and `resources.requests.memory` to `64Mi`, then apply the update.',
        stepsToComplete: [
          '1. Run `kubectl describe pod web-app` to confirm the OOMKilled termination reason.',
          '2. Switch to the YAML Editor tab.',
          '3. Update `resources.limits.memory` to `256Mi` (or `512Mi`).',
          '4. Click "Apply to Cluster" or apply via terminal.',
          '5. Verify `kubectl get pods` shows pod is `Running (1/1 Ready)` with 0 new restarts.',
        ],
        actionHint: 'Tip: You can edit the YAML in the YAML Editor tab or use `kubectl edit deployment web-app`.',
      },
      {
        id: 'quiz',
        type: 'QUIZ',
        title: 'Identify Memory Leaks vs Sizing',
        subtitle: 'Test your understanding of OOM troubleshooting',
        question: 'What is the primary difference between memory "requests" and memory "limits" in Kubernetes?',
        options: [
          'Requests are used by the scheduler to place the pod on a node; limits define the maximum ceiling enforced by cgroups before OOMKilled.',
          'Requests define the maximum memory, while limits define the minimum.',
          'Requests apply to disk storage, while limits apply to CPU and RAM.',
          'There is no difference; both values must always be identical.',
        ],
        correctIndex: 0,
        explanation: 'Memory requests tell the kube-scheduler how much memory a node must have free to schedule the pod. Limits tell the Linux cgroup engine when to terminate the container if it exceeds that memory threshold.',
      },
      {
        id: 'validation',
        type: 'VALIDATION',
        title: 'Validate Workload Stability',
        subtitle: 'Verify the pod no longer gets terminated by OOM',
        explanation: 'Run the validation check to verify that your memory resource limits have been updated and the pod is stable.',
        requirements: [
          'Memory limit increased to at least 128Mi/256Mi.',
          'Pod is in Running state (1/1 Ready).',
          'Zero OOMKilled (Exit 137) events after the update.',
        ],
      },
    ],
  },

  'missing-configmap': {
    code: '04',
    scenarioId: 'missing-configmap',
    name: 'Missing ConfigMap',
    category: 'Reliability',
    difficulty: 'Intermediate',
    summary: 'Application container fails to initialize because required ConfigMap dependency is missing.',
    steps: [
      {
        id: 'intro',
        type: 'LESSON',
        title: 'What is CreateContainerConfigError',
        subtitle: 'Understanding missing configuration dependencies',
        concept: 'CreateContainerConfigError occurs when a Pod manifest references a ConfigMap or Secret (via envFrom, valueFrom.configMapKeyRef, or volumes.configMap) that does not exist in the pod\'s namespace or is missing the expected data key.',
        flow: [
          { label: 'POD INIT', sub: 'Reads ConfigMap', color: 'emerald' },
          { label: 'KUBELET', sub: 'ConfigMap Not Found', color: 'rose' },
          { label: 'ERROR', sub: 'CreateContainerConfigError', color: 'rose' },
        ],
        keyTakeaways: [
          'This error occurs BEFORE the container process starts.',
          'The pod cannot start until the referenced ConfigMap is created with matching key names.',
          'ConfigMaps are namespace-scoped; a ConfigMap in "default" cannot be read by a pod in another namespace.',
        ],
      },
      {
        id: 'diagnostics',
        type: 'DIAGNOSTICS',
        title: 'Inspect Pod Events & Missing Key',
        subtitle: 'How to discover the exact missing ConfigMap name',
        explanation: 'Run `kubectl describe pod` to see the exact name of the missing ConfigMap or key.',
        commands: [
          {
            cmd: 'kubectl get pods',
            desc: 'View pod status (shows CreateContainerConfigError).',
          },
          {
            cmd: 'kubectl describe pod web-app',
            desc: 'Check warning events for "configmap <name> not found" or "key <key> not found".',
          },
          {
            cmd: 'kubectl get configmaps',
            desc: 'List all existing ConfigMaps in the current namespace to see what exists.',
          },
          {
            cmd: 'kubectl get deployment web-app -o yaml',
            desc: 'Inspect the env[].valueFrom.configMapKeyRef in the container spec.',
          },
        ],
        exampleOutput: {
          title: 'Sample Event from kubectl describe pod:',
          code: `Events:
  Type     Reason     Age                From               Message
  ----     ------     ----               ----               -------
  Warning  Failed     12s (x6 over 1m)   kubelet            Error: configmap "app-config" not found`,
        },
      },
      {
        id: 'deepdive',
        type: 'LESSON',
        title: 'ConfigMap Creation & Injection Methods',
        subtitle: 'How to create and bind ConfigMaps to environment variables',
        explanation: 'ConfigMaps store non-confidential configuration in key-value pairs. Here is how to create one using YAML or the CLI.',
        comparison: {
          badTitle: 'Broken Reference (ConfigMap Missing)',
          badCode: `spec:
  containers:
  - name: web-app
    image: nginx:1.25-alpine
    env:
    - name: APP_COLOR
      valueFrom:
        configMapKeyRef:
          name: app-config   # Does not exist in namespace!
          key: APP_COLOR`,
          badReason: 'Kubelet attempts to lookup "app-config", fails with 404, and stops pod initialization.',
          goodTitle: 'ConfigMap Definition YAML',
          goodCode: `apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  APP_COLOR: "emerald"
  ENVIRONMENT: "production"`,
          goodReason: 'ConfigMap exists in the namespace. Kubelet injects the value and boots the container successfully.',
        },
      },
      {
        id: 'task',
        type: 'TASK',
        title: 'Provision ConfigMap & Apply YAML',
        subtitle: 'Create the missing ConfigMap to unblock the pod',
        instruction: 'Inspect the failing pod to identify the missing ConfigMap name, create the ConfigMap in your namespace, and verify the pod starts.',
        stepsToComplete: [
          '1. Run `kubectl describe pod web-app` to identify the missing ConfigMap name.',
          '2. Create the ConfigMap via CLI: `kubectl create configmap app-config --from-literal=APP_COLOR=emerald` (or via YAML).',
          '3. Check `kubectl get configmap` to confirm it is created.',
          '4. Run `kubectl get pods` to verify the pod automatically transitions to `Running (1/1)`.',
        ],
        actionHint: 'Tip: You can use `kubectl create configmap <name> --from-literal=KEY=VALUE` directly in the terminal!',
      },
      {
        id: 'quiz',
        type: 'QUIZ',
        title: 'ConfigMap Lifecycle & Hot-Reload',
        subtitle: 'Test your understanding of Kubernetes configuration',
        question: 'If you update a ConfigMap that is mounted as an environment variable (envFrom or configMapKeyRef), when does the running container receive the updated value?',
        options: [
          'Immediately in real time without restarting.',
          'Environment variables are only set at container startup; the pod must be restarted (e.g. rollout restart) to read the new values.',
          'Within 60 seconds automatically via Kubelet.',
          'Never; ConfigMaps are immutable once deployed.',
        ],
        correctIndex: 1,
        explanation: 'Environment variables are set when a process is spawned on startup. Updating a ConfigMap does NOT update existing environment variables inside already-running processes. You must restart the pod to load new env values.',
      },
      {
        id: 'validation',
        type: 'VALIDATION',
        title: 'Validate Environment Injected',
        subtitle: 'Automated evaluation of ConfigMap resolution',
        explanation: 'Verify your ConfigMap is created and the application pod is healthy.',
        requirements: [
          'ConfigMap exists in the namespace with required data keys.',
          'Pod transitions out of CreateContainerConfigError to Running (1/1 Ready).',
          'Application environment variables are successfully populated.',
        ],
      },
    ],
  },

  'service-connectivity': {
    code: '05',
    scenarioId: 'service-connectivity',
    name: 'Service Connectivity Failure',
    category: 'Reliability',
    difficulty: 'Intermediate',
    summary: 'Service exists in namespace but routes zero traffic due to selector mismatch.',
    steps: [
      {
        id: 'intro',
        type: 'LESSON',
        title: 'What is Service Connectivity Failure',
        subtitle: 'Why Kubernetes Services fail to route traffic to Pods',
        concept: 'A Service Connectivity Failure occurs when a Service has a valid IP (ClusterIP), but routes 0 traffic because its label selector (`spec.selector`) does not match the labels on any running Pods (`metadata.labels`), resulting in an empty Endpoints list (<none>).',
        flow: [
          { label: 'CLIENT', sub: 'Requests Service IP', color: 'emerald' },
          { label: 'SERVICE', sub: 'Selector Mismatch', color: 'amber' },
          { label: 'ENDPOINTS', sub: '<none> / 0 Pods', color: 'rose' },
        ],
        keyTakeaways: [
          'Services do NOT connect to pods by name; they connect strictly by label selectors.',
          'Always check "kubectl get endpoints <service-name>". If ENDPOINTS is <none>, traffic cannot be routed.',
          'TargetPort on the Service must match the containerPort the app is actually listening on.',
        ],
      },
      {
        id: 'diagnostics',
        type: 'DIAGNOSTICS',
        title: 'Inspect Service Endpoints & DNS',
        subtitle: 'How to diagnose missing endpoints and label mismatches',
        explanation: 'Compare the `spec.selector` in your Service manifest with `spec.template.metadata.labels` on your Deployment.',
        commands: [
          {
            cmd: 'kubectl get endpoints web-service',
            desc: 'Check if endpoints are populated with pod IPs or showing <none>.',
          },
          {
            cmd: 'kubectl get pods --show-labels',
            desc: 'View the exact labels attached to your running pods.',
          },
          {
            cmd: 'kubectl describe service web-service',
            desc: 'Inspect Service Selector, TargetPort, and Endpoint count.',
          },
          {
            cmd: 'kubectl get service web-service -o yaml',
            desc: 'View full Service manifest specification.',
          },
        ],
        exampleOutput: {
          title: 'Sample kubectl get endpoints output:',
          code: `NAME          ENDPOINTS          AGE
web-service   <none>             2m14s`,
        },
      },
      {
        id: 'deepdive',
        type: 'LESSON',
        title: 'Selectors, TargetPort & Endpoints',
        subtitle: 'Aligning Service selectors with Pod labels',
        explanation: 'Let\'s see a broken Service selector vs a corrected Service selector.',
        comparison: {
          badTitle: 'Broken Service Selector (Mismatch)',
          badCode: `apiVersion: v1
kind: Service
metadata:
  name: web-service
spec:
  selector:
    app: web-server-v2   # Mismatch! Pod label is "app: web-app"
  ports:
  - port: 80
    targetPort: 80`,
          badReason: 'No pods have label "app: web-server-v2". Endpoints list remains empty (<none>).',
          goodTitle: 'Corrected Service Selector (Matched)',
          goodCode: `apiVersion: v1
kind: Service
metadata:
  name: web-service
spec:
  selector:
    app: web-app         # Exactly matches Pod label "app: web-app"
  ports:
  - port: 80
    targetPort: 80`,
          goodReason: 'Service discovers pod IP and populates Endpoints: 10.244.0.15:80. Traffic routes instantly.',
        },
      },
      {
        id: 'task',
        type: 'TASK',
        title: 'Fix Service Selector in YAML',
        subtitle: 'Align label selector with pod labels',
        instruction: 'Inspect the Service "web-service" and the Deployment "web-app". Find the mismatched selector key/value, update `service.yaml` in the YAML Editor, and apply the fix.',
        stepsToComplete: [
          '1. Run `kubectl get pods --show-labels` to check pod labels (e.g. `app=web-app`).',
          '2. Run `kubectl describe service web-service` and observe `Selector: app=web-server-v2` and `Endpoints: <none>`.',
          '3. Switch to the YAML Editor tab.',
          '4. Fix `spec.selector.app` to `web-app`.',
          '5. Apply the manifest and verify `kubectl get endpoints web-service` shows pod IP and port.',
        ],
        actionHint: 'Tip: Use `kubectl get endpoints` to immediately confirm traffic routing!',
      },
      {
        id: 'quiz',
        type: 'QUIZ',
        title: 'ClusterIP vs NodePort Resolution',
        subtitle: 'Test your Kubernetes networking knowledge',
        question: 'If a Pod is in CrashLoopBackOff (unready), does Kubernetes keep its IP in the Service Endpoints list?',
        options: [
          'Yes, traffic is still forwarded so the container can recover.',
          'No, Kubernetes automatically removes unready or crashing pods from the Endpoints list to prevent routing traffic to broken instances.',
          'Only if the Service type is LoadBalancer.',
          'Yes, but with an automatic 30-second delay.',
        ],
        correctIndex: 1,
        explanation: 'Kubernetes readiness controllers only include pods in the Service Endpoints slice if they pass all readiness probes and are in a healthy Ready state.',
      },
      {
        id: 'validation',
        type: 'VALIDATION',
        title: 'Validate HTTP Service Endpoint',
        subtitle: 'Verify service routing and active endpoints',
        explanation: 'Run the automated solution check to verify that the Service Endpoints are populated and traffic reaches the pod.',
        requirements: [
          'Service "web-service" exists with matched selector.',
          'Endpoints list contains at least 1 healthy pod IP.',
          'HTTP traffic to Service port 80 resolves with HTTP 200 OK.',
        ],
      },
    ],
  },

  'ingress-tls-failure': {
    code: '06',
    scenarioId: 'ingress-tls-failure',
    name: 'Ingress TLS Failure',
    category: 'Security',
    difficulty: 'Advanced',
    summary: 'Ingress layer fails TLS termination due to missing or misconfigured TLS Secret.',
    steps: [
      {
        id: 'intro',
        type: 'LESSON',
        title: 'What is Ingress & TLS Failure',
        subtitle: 'Understanding HTTPS certificate termination in Kubernetes',
        concept: 'Ingress TLS Failure occurs when an Ingress resource specifies TLS termination (`spec.tls`), but the referenced `secretName` containing the SSL certificate (`tls.crt`) and private key (`tls.key`) does not exist in the namespace or is invalid.',
        flow: [
          { label: 'HTTPS REQ', sub: 'Hits Ingress Controller', color: 'emerald' },
          { label: 'INGRESS', sub: 'Secret Not Found', color: 'rose' },
          { label: 'SSL ERROR', sub: 'Certificate Error / 503', color: 'rose' },
        ],
        keyTakeaways: [
          'TLS Secrets must be of type "kubernetes.io/tls".',
          'Secrets must exist in the exact same namespace as the Ingress resource.',
          'The domain name in "spec.tls.hosts" must match the certificate Common Name / SAN.',
        ],
      },
      {
        id: 'diagnostics',
        type: 'DIAGNOSTICS',
        title: 'Inspect Ingress Controller Events',
        subtitle: 'How to audit Ingress TLS secret errors',
        explanation: 'Inspect the Ingress resource events to check for SSL certificate synchronization failures.',
        commands: [
          {
            cmd: 'kubectl get ingress',
            desc: 'Check ingress host, address, and ports (80, 443).',
          },
          {
            cmd: 'kubectl describe ingress web-ingress',
            desc: 'View TLS configuration and warning events about missing secret.',
          },
          {
            cmd: 'kubectl get secrets',
            desc: 'List all Secrets in the namespace and verify secret types.',
          },
          {
            cmd: 'kubectl get secret web-tls -o yaml',
            desc: 'Inspect tls.crt and tls.key data fields.',
          },
        ],
        exampleOutput: {
          title: 'Sample Event from kubectl describe ingress:',
          code: `Events:
  Type     Reason     Age                From                      Message
  ----     ------     ----               ----                      -------
  Warning  Sync       30s (x4 over 2m)   nginx-ingress-controller  Error configuring TLS: secret "web-tls" not found`,
        },
      },
      {
        id: 'deepdive',
        type: 'LESSON',
        title: 'TLS Secret Format & Host Mismatch',
        subtitle: 'Creating standard kubernetes.io/tls secrets',
        explanation: 'A valid TLS Secret must have `type: kubernetes.io/tls` and contain both `tls.crt` and `tls.key` in base64 encoding.',
        comparison: {
          badTitle: 'Broken Ingress (References Missing Secret)',
          badCode: `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web-ingress
spec:
  tls:
  - hosts:
    - app.example.com
    secretName: web-tls   # Secret does not exist!`,
          badReason: 'Ingress controller cannot load SSL certificate. HTTPS connections fail with certificate errors or 503.',
          goodTitle: 'TLS Secret Creation via CLI',
          goodCode: `kubectl create secret tls web-tls \\
  --cert=path/to/tls.crt \\
  --key=path/to/tls.key \\
  -n <namespace>`,
          goodReason: 'Creates properly formatted kubernetes.io/tls secret. Ingress controller loads SSL cert and serves valid HTTPS.',
        },
      },
      {
        id: 'task',
        type: 'TASK',
        title: 'Provision TLS Secret & Fix Ingress',
        subtitle: 'Create the TLS secret and update the Ingress manifest',
        instruction: 'Inspect the failing Ingress resource "web-ingress", create the required TLS Secret or update the `secretName` reference in the Ingress spec, and verify.',
        stepsToComplete: [
          '1. Run `kubectl describe ingress web-ingress` to check the missing secret name.',
          '2. Check existing secrets with `kubectl get secrets`.',
          '3. Update the `secretName` in `ingress.yaml` or provision the missing TLS secret.',
          '4. Apply the updated manifest.',
          '5. Verify `kubectl describe ingress web-ingress` shows clean sync with no warning events.',
        ],
        actionHint: 'Tip: Ensure the secretName matches the actual TLS Secret in your namespace!',
      },
      {
        id: 'quiz',
        type: 'QUIZ',
        title: 'Verify SSL Handshake & Host Rule',
        subtitle: 'Test your Ingress and TLS certificate knowledge',
        question: 'Can an Ingress in namespace "production" reference a TLS Secret that exists in namespace "default"?',
        options: [
          'Yes, Secrets in "default" are globally accessible to all namespaces.',
          'No, Kubernetes Secrets are strictly namespace-scoped and cannot be accessed across namespace boundaries.',
          'Yes, if the Ingress specifies "global-secret: true".',
          'Only if RBAC allows cluster-admin privileges.',
        ],
        correctIndex: 1,
        explanation: 'Kubernetes Secrets are strictly namespaced for multi-tenant isolation and security. An Ingress resource can only access Secrets created in the exact same namespace.',
      },
      {
        id: 'validation',
        type: 'VALIDATION',
        title: 'Validate HTTPS Termination',
        subtitle: 'Automated evaluation of Ingress and TLS configuration',
        explanation: 'Run the validation check to verify that your Ingress and TLS certificates are configured correctly.',
        requirements: [
          'TLS Secret exists in the target namespace with valid certificates.',
          'Ingress spec references the correct secretName and host.',
          'Ingress controller synchronizes without warning events.',
        ],
      },
    ],
  },

  'topic-pods': {
    code: '07',
    scenarioId: 'topic-pods',
    name: 'Pods & Multi-Container Pods',
    category: 'Kubernetes Basics',
    difficulty: 'Beginner',
    summary: 'Master the atomic scheduling unit of Kubernetes and multi-container patterns.',
    steps: [
      {
        id: 'intro',
        type: 'LESSON',
        title: 'What is a Kubernetes Pod',
        subtitle: 'Understanding the atomic scheduling unit in Kubernetes',
        concept: 'A Pod is the smallest deployable unit in Kubernetes. Containers within a Pod share the same network namespace (including IP address and ports) and can communicate via localhost. They can also share mounted storage volumes for inter-process logging or data exchange.',
        flow: [
          { label: 'KUBE-SCHEDULER', sub: 'Schedules Pod to Node', color: 'emerald' },
          { label: 'CONTAINER 1', sub: 'Web App (Port 80)', color: 'emerald' },
          { label: 'CONTAINER 2', sub: 'Sidecar Logger (localhost)', color: 'amber' },
        ],
        keyTakeaways: [
          'Pods encapsulate one or more tightly coupled containers that share lifecycle, network, and storage.',
          'Containers within the same Pod communicate using localhost and cannot have conflicting port bindings.',
          'Pods are ephemeral—they are created, assigned unique IDs, and replaced rather than repaired.',
        ],
      },
      {
        id: 'diagnostics',
        type: 'DIAGNOSTICS',
        title: 'Inspect Pods & Multi-Container Specs',
        subtitle: 'Essential CLI commands to inspect pod status and logs',
        explanation: 'Learn how to inspect individual containers within multi-container pods.',
        commands: [
          {
            cmd: 'kubectl get pods -o wide',
            desc: 'View pod phase, IP address, and assigned worker node.',
          },
          {
            cmd: 'kubectl describe pod web-app',
            desc: 'Inspect all container definitions, volume mounts, and lifecycle events.',
          },
          {
            cmd: 'kubectl logs web-app -c nginx',
            desc: 'Stream logs from a specific container inside a multi-container pod.',
          },
          {
            cmd: 'kubectl exec -it web-app -c nginx -- env',
            desc: 'Run commands inside a specific container in the pod.',
          },
        ],
        exampleOutput: {
          title: 'Sample multi-container pod status:',
          code: `NAME      READY   STATUS    RESTARTS   AGE   IP           NODE
web-app   2/2     Running   0          5m    10.244.0.5   node-1`,
        },
      },
      {
        id: 'deepdive',
        type: 'LESSON',
        title: 'Sidecar Pattern & Shared Volumes',
        subtitle: 'How auxiliary containers enhance primary services',
        explanation: 'The Sidecar Pattern uses a secondary container to perform helper tasks (such as log shipping, metrics collection, or proxying) while sharing an emptyDir volume with the primary container.',
        comparison: {
          badTitle: 'Single Container Without Auxiliary Logging',
          badCode: `spec:
  containers:
  - name: app
    image: nginx:1.25.3
    # Logs are only written to local disk, lost on pod exit!`,
          badReason: 'Application logs are trapped inside the container with no dedicated shipper.',
          goodTitle: 'Multi-Container Pod with Shared Volume',
          goodCode: `spec:
  volumes:
  - name: shared-logs
    emptyDir: {}
  containers:
  - name: app
    image: nginx:1.25.3
    volumeMounts:
    - name: shared-logs
      mountPath: /var/log/nginx
  - name: log-sidecar
    image: alpine:3.18
    command: ["sh", "-c", "tail -F /var/log/nginx/access.log"]
    volumeMounts:
    - name: shared-logs
      mountPath: /var/log/nginx`,
          goodReason: 'App and Sidecar share access to /var/log/nginx. Sidecar streams logs reliably.',
        },
      },
      {
        id: 'task',
        type: 'TASK',
        title: 'Deploy & Audit Multi-Container Workload',
        subtitle: 'Hands-on practice with container specifications',
        instruction: 'Inspect the deployment manifest, configure the container specifications with proper ports and resources, and verify that the pod reaches a 1/1 Running state.',
        stepsToComplete: [
          '1. Run `kubectl get pods` to view active workloads.',
          '2. Inspect the pod details with `kubectl describe pod web-app`.',
          '3. Review the container specs in `deployment.yaml`.',
          '4. Apply the manifest and verify the pod reaches 1/1 Ready.',
        ],
        actionHint: 'Tip: Ensure container ports do not conflict on localhost!',
      },
      {
        id: 'quiz',
        type: 'QUIZ',
        title: 'Pod Networking & Communication',
        subtitle: 'Test your understanding of Pod architecture',
        question: 'How do two containers located inside the exact same Kubernetes Pod communicate with each other over the network?',
        options: [
          'Through the external Kubernetes Ingress controller.',
          'Via "localhost" using distinct port numbers, because they share the same network namespace.',
          'By querying the Kubernetes DNS service name.',
          'Containers in the same pod cannot communicate over the network.',
        ],
        correctIndex: 1,
        explanation: 'Containers in the same Pod share the same network namespace and IP address, so they communicate over localhost using standard TCP/UDP ports.',
      },
      {
        id: 'validation',
        type: 'VALIDATION',
        title: 'Validate Pod Status & Readiness',
        subtitle: 'Automated evaluation of pod workload health',
        explanation: 'Run the validation check to verify that your Pod is correctly scheduled, initialized, and Ready.',
        requirements: [
          'Pod is in the Running phase with 1/1 Ready condition.',
          'No restart loops or container initialization errors.',
          'Containers pass all liveness and readiness checks.',
        ],
      },
    ],
  },

  'topic-deployments': {
    code: '08',
    scenarioId: 'topic-deployments',
    name: 'Deployments & Rolling Updates',
    category: 'Kubernetes Basics',
    difficulty: 'Beginner',
    summary: 'Declaratively manage replica sets, rolling updates, and zero-downtime rollouts.',
    steps: [
      {
        id: 'intro',
        type: 'LESSON',
        title: 'Declarative Deployments & Replicas',
        subtitle: 'Managing stateless application lifecycles at scale',
        concept: 'A Deployment provides declarative updates for Pods and ReplicaSets. You describe a desired state in a Deployment manifest, and the Deployment Controller changes the actual state to the desired state at a controlled rate.',
        flow: [
          { label: 'DEPLOYMENT', sub: 'Desired: 3 Replicas', color: 'emerald' },
          { label: 'REPLICASET', sub: 'Manages Pod Instances', color: 'emerald' },
          { label: 'PODS [1, 2, 3]', sub: 'Serving Traffic', color: 'emerald' },
        ],
        keyTakeaways: [
          'Deployments manage ReplicaSets, which in turn manage individual Pod instances.',
          'They support zero-downtime rolling updates by replacing old pods with new pods incrementally.',
          'If a rollout encounters errors, you can instantly rollback to a previous revision.',
        ],
      },
      {
        id: 'diagnostics',
        type: 'DIAGNOSTICS',
        title: 'Inspect Rollouts, Revisions & Scaling',
        subtitle: 'Essential CLI commands to manage deployment rollouts',
        explanation: 'Master the commands to scale replicas and monitor rollout progression.',
        commands: [
          {
            cmd: 'kubectl get deployments',
            desc: 'Check ready, up-to-date, and available replica counts.',
          },
          {
            cmd: 'kubectl rollout status deployment/web-app',
            desc: 'Monitor the real-time progress of a rolling update.',
          },
          {
            cmd: 'kubectl rollout history deployment/web-app',
            desc: 'View deployment revision history and applied changes.',
          },
          {
            cmd: 'kubectl scale deployment web-app --replicas=3',
            desc: 'Dynamically scale the deployment replica count.',
          },
        ],
        exampleOutput: {
          title: 'Sample deployment status:',
          code: `NAME      READY   UP-TO-DATE   AVAILABLE   AGE
web-app   3/3     3            3           10m`,
        },
      },
      {
        id: 'deepdive',
        type: 'LESSON',
        title: 'Rolling Updates vs Recreate Strategy',
        subtitle: 'Understanding zero-downtime rollout parameters',
        explanation: 'The RollingUpdate strategy ensures that some old pods remain available while new pods are spinning up, using maxSurge and maxUnavailable to control rate.',
        comparison: {
          badTitle: 'Recreate Strategy (Causes Temporary Downtime)',
          badCode: `spec:
  strategy:
    type: Recreate
    # Kills all existing pods BEFORE creating new ones!`,
          badReason: 'All old pods are terminated before new pods start, causing a service outage during deployment.',
          goodTitle: 'RollingUpdate Strategy (Zero Downtime)',
          goodCode: `spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 0`,
          goodReason: 'New pods are created and must pass readiness probes before old pods are terminated.',
        },
      },
      {
        id: 'task',
        type: 'TASK',
        title: 'Scale & Verify Rolling Deployment',
        subtitle: 'Hands-on practice with replica management',
        instruction: 'Scale the "web-app" deployment to 2 or more replicas, ensure all pods are running and ready, and check rollout status.',
        stepsToComplete: [
          '1. Run `kubectl get deployments` to inspect current replica counts.',
          '2. Update `replicas: 2` in `deployment.yaml` or scale via CLI.',
          '3. Apply changes and run `kubectl rollout status deployment/web-app`.',
          '4. Verify all replicas are ready with `kubectl get pods`.',
        ],
        actionHint: 'Tip: Check availableReplicas in kubectl describe deployment web-app!',
      },
      {
        id: 'quiz',
        type: 'QUIZ',
        title: 'Zero-Downtime Rollout Strategy',
        subtitle: 'Test your Deployment strategy knowledge',
        question: 'What setting ensures that zero existing pods are terminated until new replacement pods are completely Ready?',
        options: [
          'strategy.type: Recreate',
          'spec.strategy.rollingUpdate.maxUnavailable: 0',
          'spec.replicas: 0',
          'spec.minReadySeconds: 0',
        ],
        correctIndex: 1,
        explanation: 'Setting maxUnavailable: 0 guarantees that the Deployment controller will never shut down an existing pod until a new pod has successfully started and passed its readiness checks.',
      },
      {
        id: 'validation',
        type: 'VALIDATION',
        title: 'Validate Deployment Health & Replicas',
        subtitle: 'Automated evaluation of deployment state',
        explanation: 'Run the validation check to verify that all desired replicas are active and available.',
        requirements: [
          'Deployment has at least 1 available replica.',
          'All pods in the deployment pass readiness checks.',
          'No rollout errors or pending pod updates.',
        ],
      },
    ],
  },

  'topic-services': {
    code: '09',
    scenarioId: 'topic-services',
    name: 'Services & Cluster Networking',
    category: 'Kubernetes Basics',
    difficulty: 'Beginner',
    summary: 'Expose workloads internally and externally via ClusterIP, NodePort, and LoadBalancer.',
    steps: [
      {
        id: 'intro',
        type: 'LESSON',
        title: 'Service Discovery & L4 Networking',
        subtitle: 'How Kubernetes provides stable network endpoints',
        concept: 'In Kubernetes, Pods are ephemeral and their IP addresses change frequently. A Service is an abstraction that defines a logical set of Pods and a policy to access them via a stable IP address and DNS name.',
        flow: [
          { label: 'CLIENT', sub: 'Requests web-service:80', color: 'emerald' },
          { label: 'SERVICE (ClusterIP)', sub: 'Stable Virtual IP', color: 'emerald' },
          { label: 'ENDPOINTS', sub: 'Load balances to Pod IPs', color: 'emerald' },
        ],
        keyTakeaways: [
          'Services use label selectors to automatically track healthy Pod IPs in an Endpoints object.',
          'ClusterIP is the default service type, exposing the service on an internal cluster-only IP.',
          'CoreDNS automatically creates DNS records for every Service in the format `<service>.<namespace>.svc.cluster.local`.',
        ],
      },
      {
        id: 'diagnostics',
        type: 'DIAGNOSTICS',
        title: 'Inspect Services, Endpoints & DNS',
        subtitle: 'Essential CLI commands to trace service routing',
        explanation: 'Learn how to inspect Services and verify that backend Endpoints are populated.',
        commands: [
          {
            cmd: 'kubectl get services',
            desc: 'List services, ClusterIPs, and exposed port mappings.',
          },
          {
            cmd: 'kubectl get endpoints web-service',
            desc: 'Check the target pod IP addresses registered behind the service.',
          },
          {
            cmd: 'kubectl describe service web-service',
            desc: 'Inspect label selectors, port/targetPort mapping, and active endpoints.',
          },
        ],
        exampleOutput: {
          title: 'Sample service endpoints:',
          code: `NAME          ENDPOINTS            AGE
web-service   10.244.0.5:80        15m`,
        },
      },
      {
        id: 'deepdive',
        type: 'LESSON',
        title: 'Port vs TargetPort vs NodePort',
        subtitle: 'Understanding Kubernetes service port mapping',
        explanation: 'A Service defines `port` (the port the service exposes inside the cluster) and `targetPort` (the port the container is listening on).',
        comparison: {
          badTitle: 'Mismatched TargetPort (Connection Refused)',
          badCode: `spec:
  ports:
  - port: 80
    targetPort: 8080 # BAD: Container is listening on 80!`,
          badReason: 'Traffic arrives at the pod on port 8080, where nothing is listening, returning Connection Refused.',
          goodTitle: 'Correct Port Alignment',
          goodCode: `spec:
  ports:
  - port: 80
    targetPort: 80   # GOOD: Matches containerPort: 80`,
          goodReason: 'Traffic forwarded from Service port 80 connects directly to Nginx listening on port 80.',
        },
      },
      {
        id: 'task',
        type: 'TASK',
        title: 'Deploy Service & Verify Endpoints',
        subtitle: 'Hands-on practice with service networking',
        instruction: 'Inspect the Service manifest, verify that its `spec.selector` matches the Pod labels, and confirm that `kubectl get endpoints` displays healthy target pods.',
        stepsToComplete: [
          '1. Run `kubectl get pods --show-labels` to see pod label metadata.',
          '2. Check `service.yaml` to ensure selector matches `app: web-app`.',
          '3. Apply the service manifest.',
          '4. Verify endpoints are registered with `kubectl get endpoints web-service`.',
        ],
        actionHint: 'Tip: If Endpoints is <none>, check your selector label spelling!',
      },
      {
        id: 'quiz',
        type: 'QUIZ',
        title: 'Service Routing Mechanism',
        subtitle: 'Test your Kubernetes networking knowledge',
        question: 'How does a Kubernetes Service determine which Pods should receive incoming traffic?',
        options: [
          'By matching the Pod hostname to the Service name.',
          'By using label selectors (spec.selector) that match the labels on running Pods.',
          'By scanning for all pods running in the same namespace automatically.',
          'By manual IP address configuration in the kube-proxy table.',
        ],
        correctIndex: 1,
        explanation: 'Kubernetes Services use label selectors to dynamically match and discover Pods. Any healthy Pod with matching labels is automatically added to the Service Endpoints list.',
      },
      {
        id: 'validation',
        type: 'VALIDATION',
        title: 'Validate Service & Endpoint Connectivity',
        subtitle: 'Automated evaluation of service networking',
        explanation: 'Run the validation check to verify that your Service is properly created and routing to ready pod endpoints.',
        requirements: [
          'Service exists in the namespace with valid ClusterIP.',
          'Service selector correctly matches running pod labels.',
          'Endpoints object has at least 1 healthy pod target IP.',
        ],
      },
    ],
  },

  'topic-configmaps': {
    code: '10',
    scenarioId: 'topic-configmaps',
    name: 'ConfigMaps & Environment Injection',
    category: 'Configuration',
    difficulty: 'Beginner',
    summary: 'Decouple runtime parameters and configuration files from container images.',
    steps: [
      {
        id: 'intro',
        type: 'LESSON',
        title: 'Decoupling Configuration from Code',
        subtitle: 'Store configuration parameters outside container images',
        concept: 'A ConfigMap is an API object used to store non-confidential data in key-value pairs. Pods can consume ConfigMaps as environment variables, command-line arguments, or as configuration files mounted in a volume.',
        flow: [
          { label: 'CONFIGMAP', sub: 'Key-Value Pairs (APP_ENV)', color: 'emerald' },
          { label: 'POD SPEC', sub: 'envFrom / valueFrom', color: 'emerald' },
          { label: 'CONTAINER', sub: 'Reads Environment Variable', color: 'emerald' },
        ],
        keyTakeaways: [
          'ConfigMaps adhere to the 12-Factor App methodology by separating configuration from application code.',
          'You can inject ConfigMap values as individual environment variables or entire env dictionaries using envFrom.',
          'ConfigMaps mounted as volumes update dynamically when modified, without requiring a container image rebuild.',
        ],
      },
      {
        id: 'diagnostics',
        type: 'DIAGNOSTICS',
        title: 'Inspect ConfigMaps & Environment',
        subtitle: 'Essential CLI commands to inspect configuration',
        explanation: 'Master commands to inspect ConfigMaps and verify environment variable injection.',
        commands: [
          {
            cmd: 'kubectl get configmaps',
            desc: 'List all ConfigMaps in the current namespace.',
          },
          {
            cmd: 'kubectl describe configmap app-config',
            desc: 'View key-value pairs and data entries inside the ConfigMap.',
          },
          {
            cmd: 'kubectl exec -it web-app -- env',
            desc: 'Print all environment variables inside the running container.',
          },
        ],
        exampleOutput: {
          title: 'Sample ConfigMap describe output:',
          code: `Name:         app-config
Namespace:    default
Data
====
APP_ENV:      production
LOG_LEVEL:    info`,
        },
      },
      {
        id: 'deepdive',
        type: 'LESSON',
        title: 'Environment Variables vs Volume Mounts',
        subtitle: 'Two ways containers consume ConfigMaps',
        explanation: 'ConfigMaps can be injected directly into process environment variables or mounted as read-only configuration files in the container filesystem.',
        comparison: {
          badTitle: 'Hardcoded Configuration in Container Image',
          badCode: `ENV APP_ENV=production
ENV DB_HOST=10.0.0.1
# BAD: Requires rebuilding Docker image to change database!`,
          badReason: 'Changing environment parameters requires building, tagging, and pushing a new container image.',
          goodTitle: 'Dynamic Injection via ConfigMap',
          goodCode: `spec:
  containers:
  - name: web-app
    image: nginx:1.25.3
    env:
    - name: APP_ENV
      valueFrom:
        configMapKeyRef:
          name: app-config
          key: APP_ENV`,
          goodReason: 'Container image is environment-agnostic; configuration is managed declaratively in K8s.',
        },
      },
      {
        id: 'task',
        type: 'TASK',
        title: 'Deploy ConfigMap & Inject into Pod',
        subtitle: 'Hands-on practice with ConfigMap injection',
        instruction: 'Create or verify the "app-config" ConfigMap in the namespace, reference it in `deployment.yaml`, and confirm the pod boots successfully.',
        stepsToComplete: [
          '1. Run `kubectl get configmaps` to see existing configuration.',
          '2. Check the ConfigMap data with `kubectl describe configmap app-config`.',
          '3. Review the `env` block in `deployment.yaml`.',
          '4. Apply manifests and verify the pod is Running and Ready.',
        ],
        actionHint: 'Tip: Ensure the key in configMapKeyRef matches the exact key in the ConfigMap!',
      },
      {
        id: 'quiz',
        type: 'QUIZ',
        title: 'ConfigMap Consumption',
        subtitle: 'Test your ConfigMap knowledge',
        question: 'When a ConfigMap is consumed as environment variables via "valueFrom.configMapKeyRef", what happens when you edit the ConfigMap data?',
        options: [
          'The environment variables update instantly in all running containers without restart.',
          'Running containers keep their old environment variables until the Pod is restarted or recreated.',
          'The Pod automatically reboots immediately.',
          'Kubernetes throws a validation error.',
        ],
        correctIndex: 1,
        explanation: 'Environment variables are injected at container startup. Changing a ConfigMap will NOT update environment variables inside already-running containers until those pods are restarted.',
      },
      {
        id: 'validation',
        type: 'VALIDATION',
        title: 'Validate ConfigMap Injection',
        subtitle: 'Automated evaluation of ConfigMap state',
        explanation: 'Run the validation check to verify that your ConfigMap exists and is properly consumed by the workload.',
        requirements: [
          'ConfigMap "app-config" exists with valid data keys.',
          'Deployment references the ConfigMap without CreateContainerConfigError.',
          'Pod is in Running and Ready (1/1) state.',
        ],
      },
    ],
  },
};

export const getScenarioSteps = (scenarioId) => {
  return SCENARIO_STEPS_DATA[scenarioId] || SCENARIO_STEPS_DATA['crash-loop-backoff'];
};

export default SCENARIO_STEPS_DATA;
