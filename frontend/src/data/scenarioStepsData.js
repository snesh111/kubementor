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
        analogy: 'Imagine a computer program that tries to start up, runs into an error, crashes immediately, and keeps rebooting over and over. Kubernetes protects itself by adding a waiting delay between reboots.',
        concept: 'CrashLoopBackOff is a pod state indicating that a container in the pod starts, crashes (terminates with an error), and restarts. To prevent node CPU exhaustion from rapid infinite crashes, Kubelet waits with an increasing exponential back-off delay (10s, 20s, 40s, up to 5 minutes) between restart attempts.',
        flow: [
          { label: 'KUBELET', sub: 'Starts Container', color: 'emerald' },
          { label: 'PROCESS', sub: 'Exit Code 1 / Error', color: 'rose' },
          { label: 'BACK-OFF', sub: 'Delay (10s ➔ 5m)', color: 'amber' },
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
          badTitle: '❌ Broken Deployment YAML (Causes CrashLoop)',
          badCode: `spec:
  containers:
  - name: web-app
    image: nginx:1.25-alpine
    # BAD: This command exits immediately with error!
    command: ["sh", "-c", "echo 'Booting...' && exit 1"]`,
          badReason: 'Process exits with code 1 after 1 second. Kubelet detects exit and triggers CrashLoopBackOff.',
          goodTitle: '✅ Fixed Deployment YAML (Runs in Foreground)',
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
        analogy: 'Imagine ordering a book from an online warehouse, but you typed a non-existent ISBN number. The delivery driver searches the warehouse shelves, cannot find the book, and waits before trying again.',
        concept: 'ImagePullBackOff means Kubernetes Kubelet attempted to download (pull) the container image specified in your pod manifest from a container registry (like Docker Hub, ECR, GCR, or Quay), but the download failed. Kubelet waits with an increasing exponential back-off delay before retrying.',
        flow: [
          { label: 'KUBELET', sub: 'Pulls Image', color: 'emerald' },
          { label: 'REGISTRY', sub: '404 Not Found / Typo', color: 'rose' },
          { label: 'BACK-OFF', sub: 'Retry (10s ➔ 5m)', color: 'amber' },
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
          badTitle: '❌ Broken Deployment YAML (Non-existent Image Tag)',
          badCode: `spec:
  containers:
  - name: web-app
    # BAD: Tag 1.999.0 does not exist on Docker Hub!
    image: nginx:1.999.0
    imagePullPolicy: IfNotPresent`,
          badReason: 'Registry returns "manifest unknown" (404) because nginx:1.999.0 does not exist. Kubelet fails to start the container.',
          goodTitle: '✅ Fixed Deployment YAML (Valid Verified Tag)',
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
        analogy: 'Imagine pouring 2 liters of water into a 500ml bottle. When the water overflows the brim, the system immediately cuts off the flow to protect the surrounding table.',
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
          badTitle: '❌ Broken Resource Spec (Memory Limit Too Low)',
          badCode: `spec:
  containers:
  - name: web-app
    image: nginx:1.25-alpine
    resources:
      limits:
        memory: "8Mi"   # WAY too small! Web server needs ~32Mi
        cpu: "100m"`,
          badReason: 'Process memory usage immediately exceeds 8Mi limit on boot, triggering kernel OOMKilled (Exit 137).',
          goodTitle: '✅ Sized Resource Spec (With Headroom)',
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
        analogy: 'Imagine a car trying to start, but the ignition key or fuel injection profile is completely missing from the dashboard. The engine cannot start until the key is inserted.',
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
          badTitle: '❌ Broken Reference (ConfigMap Missing)',
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
          goodTitle: '✅ ConfigMap Definition YAML',
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
        analogy: 'Imagine a receptionist looking for employees wearing "Blue Shirts" (the Service Selector), but all your workers are wearing "Green Shirts" (Pod Labels). The receptionist has nobody to route incoming phone calls to.',
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
          badTitle: '❌ Broken Service Selector (Mismatch)',
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
          goodTitle: '✅ Corrected Service Selector (Matched)',
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
        analogy: 'Imagine setting up a secure vault with an electronic lock, but you forgot to install the encryption key chip inside the lock mechanism. The door refuses to establish a secure handshake.',
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
          badTitle: '❌ Broken Ingress (References Missing Secret)',
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
          goodTitle: '✅ TLS Secret Creation via CLI',
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
};

export const getScenarioSteps = (scenarioId) => {
  return SCENARIO_STEPS_DATA[scenarioId] || SCENARIO_STEPS_DATA['crash-loop-backoff'];
};

export default SCENARIO_STEPS_DATA;
