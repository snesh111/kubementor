import k8sClientWrapper from '../kubernetes/k8sClient.js';
import statusService from '../kubernetes/statusService.js';
import contextService from '../context/contextService.js';
import ProjectFile from '../models/ProjectFile.js';
import ScenarioAttempt from '../models/ScenarioAttempt.js';
import DeploymentRecord from '../models/DeploymentRecord.js';
import FailureScenario from '../models/FailureScenario.js';

/**
 * Formats a list of rows into aligned tabular text with header
 */
function formatTable(headers, rows) {
  if (!rows || rows.length === 0) {
    return 'No resources found in default namespace.\r\n';
  }

  const colWidths = headers.map((h, colIdx) => {
    let max = h.length;
    for (const r of rows) {
      const cell = String(r[colIdx] || '');
      if (cell.length > max) max = cell.length;
    }
    return max + 3; // 3 space padding
  });

  let out = '';
  // Header
  headers.forEach((h, idx) => {
    out += h.padEnd(colWidths[idx]);
  });
  out += '\r\n';

  // Rows
  rows.forEach((r) => {
    r.forEach((cell, idx) => {
      out += String(cell || '').padEnd(colWidths[idx]);
    });
    out += '\r\n';
  });

  return out;
}

export class TerminalSession {
  constructor({ user, project, attempt, namespace, mode, sendOutput }) {
    this.user = user;
    this.project = project;
    this.attempt = attempt;
    this.namespace = namespace;
    this.mode = mode; // 'kubernetes' | 'simulation'
    this.sendOutput = sendOutput;

    this.commandBuffer = '';
    this.cursorPos = 0;
    this.history = [];
    this.historyIndex = -1;
    this.cols = 80;
    this.rows = 24;
    this.isAlive = true;
    this.lastActivity = Date.now();
  }

  getPrompt() {
    const hostTag = this.mode === 'kubernetes' ? 'k8s' : 'sim';
    return `\x1b[1;32mlearner@kubementor-${hostTag}\x1b[0m:\x1b[1;34m~\x1b[0m$ `;
  }

  initTerminal() {
    this.sendOutput('\x1b[2J\x1b[H'); // Clear screen
    this.sendOutput(`\x1b[1;36m======================================================================\x1b[0m\r\n`);
    this.sendOutput(`\x1b[1;37m☸️  KubeMentor Interactive Lab Shell\x1b[0m\r\n`);
    this.sendOutput(`\x1b[90m----------------------------------------------------------------------\x1b[0m\r\n`);
    this.sendOutput(` \x1b[1;33m● Environment\x1b[0m : ${this.mode === 'kubernetes' ? '\x1b[1;32mLIVE KUBERNETES\x1b[0m' : '\x1b[1;35mSIMULATION SANDBOX\x1b[0m'}\r\n`);
    this.sendOutput(` \x1b[1;33m● Namespace\x1b[0m   : \x1b[1;36m${this.namespace}\x1b[0m\r\n`);
    this.sendOutput(` \x1b[1;33m● Scenario\x1b[0m    : \x1b[1;37m${this.attempt?.scenarioName || this.attempt?.scenarioId || 'Active Lab'}\x1b[0m\r\n`);
    this.sendOutput(`\x1b[1;36m======================================================================\x1b[0m\r\n`);
    this.sendOutput(`\x1b[90mType \x1b[37m'kubectl get pods'\x1b[90m or \x1b[37m'help'\x1b[90m to begin your investigation.\x1b[0m\r\n\r\n`);
    this.sendOutput(this.getPrompt());
  }

  handleInput(data) {
    this.lastActivity = Date.now();

    // If data is an escape sequence (e.g. arrow keys), process directly
    if (data.startsWith('\x1b')) {
      this.handleSingleChar(data);
      return;
    }

    // If multi-character string (e.g. pasted text or batch input), process character by character
    if (data.length > 1) {
      for (let i = 0; i < data.length; i++) {
        this.handleSingleChar(data[i]);
      }
      return;
    }

    this.handleSingleChar(data);
  }

  handleSingleChar(data) {
    // 1. Carriage Return / Enter
    if (data === '\r' || data === '\n') {
      this.sendOutput('\r\n');
      const cmd = this.commandBuffer.trim();
      if (cmd) {
        this.history.push(cmd);
        this.historyIndex = this.history.length;
        this.executeCommand(cmd).then(() => {
          this.commandBuffer = '';
          this.cursorPos = 0;
          this.sendOutput(this.getPrompt());
        });
      } else {
        this.commandBuffer = '';
        this.cursorPos = 0;
        this.sendOutput(this.getPrompt());
      }
      return;
    }

    // 2. Backspace (\x7f or \x08)
    if (data === '\x7f' || data === '\x08') {
      if (this.cursorPos > 0) {
        const left = this.commandBuffer.slice(0, this.cursorPos - 1);
        const right = this.commandBuffer.slice(this.cursorPos);
        this.commandBuffer = left + right;
        this.cursorPos--;

        // Redraw line
        this.sendOutput('\b' + right + ' ' + '\b'.repeat(right.length + 1));
      }
      return;
    }

    // 3. Ctrl+C (\x03)
    if (data === '\x03') {
      this.sendOutput('^C\r\n');
      this.commandBuffer = '';
      this.cursorPos = 0;
      this.historyIndex = this.history.length;
      this.sendOutput(this.getPrompt());
      return;
    }

    // 4. Ctrl+L (\x0c) -> Clear screen
    if (data === '\x0c') {
      this.sendOutput('\x1b[2J\x1b[H');
      this.sendOutput(this.getPrompt() + this.commandBuffer);
      return;
    }

    // 5. Ctrl+U (\x15) -> Clear whole line
    if (data === '\x15') {
      if (this.cursorPos > 0) {
        this.sendOutput('\b \b'.repeat(this.cursorPos));
        this.commandBuffer = '';
        this.cursorPos = 0;
      }
      return;
    }

    // 6. Arrow Keys (\x1b[A, \x1b[B, \x1b[C, \x1b[D)
    if (data.startsWith('\x1b[')) {
      const code = data.slice(2);
      // Up Arrow
      if (code === 'A') {
        if (this.history.length > 0 && this.historyIndex > 0) {
          this.historyIndex--;
          const prevCmd = this.history[this.historyIndex];
          this.replaceCommandLine(prevCmd);
        }
        return;
      }
      // Down Arrow
      if (code === 'B') {
        if (this.history.length > 0 && this.historyIndex < this.history.length - 1) {
          this.historyIndex++;
          const nextCmd = this.history[this.historyIndex];
          this.replaceCommandLine(nextCmd);
        } else {
          this.historyIndex = this.history.length;
          this.replaceCommandLine('');
        }
        return;
      }
      // Right Arrow
      if (code === 'C') {
        if (this.cursorPos < this.commandBuffer.length) {
          this.cursorPos++;
          this.sendOutput(data);
        }
        return;
      }
      // Left Arrow
      if (code === 'D') {
        if (this.cursorPos > 0) {
          this.cursorPos--;
          this.sendOutput(data);
        }
        return;
      }
      return;
    }

    // 7. Tab Autocompletion (\t)
    if (data === '\t') {
      this.handleTabCompletion();
      return;
    }

    // 8. Normal Printable Characters
    if (data.length === 1 && data >= ' ') {
      const left = this.commandBuffer.slice(0, this.cursorPos);
      const right = this.commandBuffer.slice(this.cursorPos);
      this.commandBuffer = left + data + right;
      this.cursorPos++;

      if (right.length > 0) {
        this.sendOutput(data + right + '\b'.repeat(right.length));
      } else {
        this.sendOutput(data);
      }
    }
  }

  replaceCommandLine(newLine) {
    if (this.cursorPos > 0) {
      this.sendOutput('\b \b'.repeat(this.cursorPos));
    }
    this.sendOutput(' '.repeat(this.commandBuffer.length) + '\b'.repeat(this.commandBuffer.length));
    this.commandBuffer = newLine;
    this.cursorPos = newLine.length;
    this.sendOutput(newLine);
  }

  handleTabCompletion() {
    const candidates = [
      'kubectl get pods',
      'kubectl get deployments',
      'kubectl get services',
      'kubectl get events',
      'kubectl get configmaps',
      'kubectl get secrets',
      'kubectl get ingress',
      'kubectl describe pod',
      'kubectl describe deployment',
      'kubectl describe service',
      'kubectl logs',
      'kubectl logs --previous',
      'kubectl top pod',
      'kubectl version',
      'deployment.yaml',
      'service.yaml',
      'configmap.yaml',
      'ingress.yaml',
      'secret.yaml',
    ];

    const current = this.commandBuffer;
    const match = candidates.find((c) => c.startsWith(current) && c !== current);
    if (match) {
      const diff = match.slice(current.length);
      this.commandBuffer = match;
      this.cursorPos = match.length;
      this.sendOutput(diff);
    }
  }

  async executeCommand(rawCommandLine) {
    const parts = rawCommandLine.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
    if (parts.length === 0) return;

    const baseCmd = parts[0];
    const args = parts.slice(1).map((a) => a.replace(/^["']|["']$/g, ''));

    // 1. Basic Linux Shell Utilities
    if (baseCmd === 'clear') {
      this.sendOutput('\x1b[2J\x1b[H');
      return;
    }

    if (baseCmd === 'pwd') {
      this.sendOutput('/home/learner\r\n');
      return;
    }

    if (baseCmd === 'whoami') {
      this.sendOutput('learner\r\n');
      return;
    }

    if (baseCmd === 'uname') {
      if (args.includes('-a')) {
        this.sendOutput('Linux kubementor-sandbox 6.1.0-sandbox #1 SMP PREEMPT x86_64 GNU/Linux\r\n');
      } else {
        this.sendOutput('Linux\r\n');
      }
      return;
    }

    if (baseCmd === 'date') {
      this.sendOutput(new Date().toUTCString() + '\r\n');
      return;
    }

    if (baseCmd === 'echo') {
      this.sendOutput(args.join(' ') + '\r\n');
      return;
    }

    if (baseCmd === 'history') {
      this.history.forEach((h, i) => {
        this.sendOutput(`  ${i + 1}  ${h}\r\n`);
      });
      return;
    }

    if (baseCmd === 'env') {
      // Safe sanitized sandbox environment variables ONLY
      this.sendOutput(`USER=learner\r\n`);
      this.sendOutput(`HOME=/home/learner\r\n`);
      this.sendOutput(`SHELL=/bin/bash\r\n`);
      this.sendOutput(`TERM=xterm-256color\r\n`);
      this.sendOutput(`KUBERNETES_NAMESPACE=${this.namespace}\r\n`);
      return;
    }

    if (baseCmd === 'ls') {
      const files = await ProjectFile.find({ project: this.project._id, owner: this.user._id }).sort({ originalName: 1 });
      if (args.includes('-la') || args.includes('-l')) {
        this.sendOutput('total 16\r\n');
        this.sendOutput('drwxr-xr-x 2 learner learner 4096 Sep 13 13:00 .\r\n');
        this.sendOutput('drwxr-xr-x 3 learner learner 4096 Sep 13 13:00 ..\r\n');
        files.forEach((f) => {
          this.sendOutput(`-rw-r--r-- 1 learner learner ${f.size} Sep 13 13:00 ${f.originalName}\r\n`);
        });
      } else {
        const names = files.map((f) => `\x1b[36m${f.originalName}\x1b[0m`).join('  ');
        this.sendOutput((names || 'deployment.yaml  service.yaml') + '\r\n');
      }
      return;
    }

    if (baseCmd === 'cat') {
      if (args.length === 0) {
        this.sendOutput('usage: cat <filename>\r\n');
        return;
      }
      const fileName = args[0];
      const fileDoc = await ProjectFile.findOne({
        project: this.project._id,
        owner: this.user._id,
        $or: [{ originalName: fileName }, { filename: fileName }],
      });

      if (fileDoc) {
        this.sendOutput(fileDoc.content.replace(/\n/g, '\r\n') + '\r\n');
      } else {
        this.sendOutput(`cat: ${fileName}: No such file or directory\r\n`);
      }
      return;
    }

    if (baseCmd === 'help') {
      this.sendOutput(`\x1b[1;36mKubeMentor Interactive Terminal Help\x1b[0m\r\n`);
      this.sendOutput(`Supported diagnostic commands for this lab:\r\n`);
      this.sendOutput(`  \x1b[33mkubectl get pods\x1b[0m                  List pods in your sandbox\r\n`);
      this.sendOutput(`  \x1b[33mkubectl describe pod <name>\x1b[0m       Inspect pod status, events, exit code\r\n`);
      this.sendOutput(`  \x1b[33mkubectl logs <name> [--previous]\x1b[0m  View container application error logs\r\n`);
      this.sendOutput(`  \x1b[33mkubectl get events\x1b[0m                List Kubelet warning and scheduling events\r\n`);
      this.sendOutput(`  \x1b[33mkubectl get deployments\x1b[0m           List deployment controllers\r\n`);
      this.sendOutput(`  \x1b[33mkubectl get services\x1b[0m              List L4 service routing & selectors\r\n`);
      this.sendOutput(`  \x1b[33mkubectl get configmaps\x1b[0m            List injected configuration objects\r\n`);
      this.sendOutput(`  \x1b[33mkubectl ls\x1b[0m                        List workspace YAML manifests\r\n`);
      this.sendOutput(`  \x1b[33mkubectl cat <file.yaml>\x1b[0m           View manifest content\r\n`);
      this.sendOutput(`  \x1b[33mclear\x1b[0m                             Clear terminal screen\r\n`);
      return;
    }

    // 2. Block Host/System Operations
    const blockedSysCommands = [
      'sudo', 'su', 'rm', 'mv', 'cp', 'shutdown', 'reboot', 'systemctl', 'service',
      'mount', 'umount', 'docker', 'podman', 'crictl', 'curl', 'wget', 'nc', 'ssh',
      'apt', 'apt-get', 'yum', 'apk', 'pip', 'npm', 'node', 'python', 'sh', 'bash'
    ];
    if (blockedSysCommands.includes(baseCmd) && baseCmd !== 'kubectl') {
      this.sendOutput(`\x1b[31mbash: ${baseCmd}: command not permitted in learner sandbox\x1b[0m\r\n`);
      return;
    }

    // 3. Kubectl Command Processing
    if (baseCmd === 'kubectl' || baseCmd === 'k') {
      await this.handleKubectlCommand(args);
      return;
    }

    // Unknown command
    this.sendOutput(`\x1b[31mbash: ${baseCmd}: command not found. Type 'help' for available commands.\x1b[0m\r\n`);
  }

  async handleKubectlCommand(args) {
    if (args.length === 0) {
      this.sendOutput('kubectl controls the Kubernetes cluster manager.\r\nType "help" for common commands.\r\n');
      return;
    }

    // Security Check 1: Block All-Namespaces (-A, --all-namespaces)
    if (args.includes('-A') || args.includes('--all-namespaces')) {
      this.sendOutput(`\x1b[31mError from server (Forbidden): Access to all namespaces is restricted in learner sandbox environment.\x1b[0m\r\n`);
      return;
    }

    // Security Check 2: Block Access to Other Namespaces (-n, --namespace)
    let explicitNamespace = null;
    for (let i = 0; i < args.length; i++) {
      if ((args[i] === '-n' || args[i] === '--namespace') && args[i + 1]) {
        explicitNamespace = args[i + 1];
      } else if (args[i].startsWith('--namespace=')) {
        explicitNamespace = args[i].split('=')[1];
      }
    }

    if (explicitNamespace && explicitNamespace !== this.namespace) {
      this.sendOutput(`\x1b[31mError from server (Forbidden): User does not have access to namespace "${explicitNamespace}". You are restricted to "${this.namespace}".\x1b[0m\r\n`);
      return;
    }

    // Security Check 3: Block Cluster-Scoped Resource Access
    const clusterScoped = [
      'nodes', 'node', 'no',
      'namespaces', 'namespace', 'ns',
      'clusterroles', 'clusterrole',
      'clusterrolebindings', 'clusterrolebinding',
      'customresourcedefinitions', 'crds', 'crd',
      'apiservices', 'componentstatuses', 'cs',
      'storageclasses', 'sc', 'persistentvolumes', 'pv'
    ];

    const subCmd = args[0]; // get, describe, logs, version, etc.
    const resourceTarget = (args[1] || '').toLowerCase();

    if (clusterScoped.includes(resourceTarget)) {
      this.sendOutput(`\x1b[31mError from server (Forbidden): ${resourceTarget} is a cluster-scoped resource and is strictly prohibited in learner sandbox.\x1b[0m\r\n`);
      return;
    }

    // Security Check 4: Block Config Context Modification
    if (subCmd === 'config') {
      this.sendOutput(`\x1b[31mError from server (Forbidden): Modifying kubeconfig or switching contexts is disabled in sandbox.\x1b[0m\r\n`);
      return;
    }

    // Subcommand: version
    if (subCmd === 'version') {
      this.sendOutput('Client Version: v1.30.2\r\nKustomize Version: v5.0.4-0.20230601165947-6ce0bd390ce3\r\n');
      if (this.mode === 'kubernetes') {
        this.sendOutput('Server Version: v1.30.0\r\n');
      } else {
        this.sendOutput('Server Version: v1.30.0 (Simulated Engine)\r\n');
      }
      return;
    }

    // Subcommand: api-resources
    if (subCmd === 'api-resources') {
      const headers = ['NAME', 'SHORTNAMES', 'APIVERSION', 'NAMESPACED', 'KIND'];
      const rows = [
        ['configmaps', 'cm', 'v1', 'true', 'ConfigMap'],
        ['endpoints', 'ep', 'v1', 'true', 'Endpoints'],
        ['events', 'ev', 'v1', 'true', 'Event'],
        ['pods', 'po', 'v1', 'true', 'Pod'],
        ['secrets', '', 'v1', 'true', 'Secret'],
        ['services', 'svc', 'v1', 'true', 'Service'],
        ['deployments', 'deploy', 'apps/v1', 'true', 'Deployment'],
        ['ingresses', 'ing', 'networking.k8s.io/v1', 'true', 'Ingress'],
      ];
      this.sendOutput(formatTable(headers, rows));
      return;
    }

    // Fetch live or simulated sandbox status
    const status = await statusService.getSandboxStatus(this.namespace);

    // Subcommand: get
    if (subCmd === 'get') {
      await this.handleKubectlGet(args.slice(1), status);
      return;
    }

    // Subcommand: describe
    if (subCmd === 'describe') {
      await this.handleKubectlDescribe(args.slice(1), status);
      return;
    }

    // Subcommand: logs
    if (subCmd === 'logs' || subCmd === 'log') {
      await this.handleKubectlLogs(args.slice(1), status);
      return;
    }

    // Subcommand: top
    if (subCmd === 'top') {
      const headers = ['NAME', 'CPU(cores)', 'MEMORY(bytes)'];
      const pod = status.pods?.[0];
      const memUsage = this.attempt?.scenarioId === 'oom-killed' ? '16Mi' : '24Mi';
      const rows = [[pod?.name || `${this.namespace}-pod-1`, '12m', memUsage]];
      this.sendOutput(formatTable(headers, rows));
      return;
    }

    // Unhandled kubectl action
    this.sendOutput(`\x1b[33mkubectl: '${subCmd}' is supported for learning diagnostics. Try 'kubectl get pods', 'kubectl describe pod <name>', or 'kubectl logs <name>'.\x1b[0m\r\n`);
  }

  async handleKubectlGet(args, status) {
    if (args.length === 0) {
      this.sendOutput('error: You must specify the type of resource to get. (e.g. pods, deployments, services, events)\r\n');
      return;
    }

    const resType = args[0].toLowerCase();

    // 1. GET PODS
    if (['pods', 'pod', 'po'].includes(resType)) {
      const pods = status.pods || [];
      if (pods.length === 0) {
        this.sendOutput(`No resources found in ${this.namespace} namespace.\r\n`);
        return;
      }

      const headers = ['NAME', 'READY', 'STATUS', 'RESTARTS', 'AGE'];
      const rows = pods.map((p) => [
        p.name,
        p.ready ? '1/1' : '0/1',
        p.containers?.[0]?.reason || (p.phase === 'Failed' ? 'CrashLoopBackOff' : p.phase),
        String(p.restarts || 0),
        '2m15s',
      ]);
      this.sendOutput(formatTable(headers, rows));
      return;
    }

    // 2. GET DEPLOYMENTS
    if (['deployments', 'deployment', 'deploy'].includes(resType)) {
      const deps = status.deployments || [];
      const headers = ['NAME', 'READY', 'UP-TO-DATE', 'AVAILABLE', 'AGE'];
      const rows = deps.map((d) => [
        d.name,
        `${d.availableReplicas}/${d.desiredReplicas}`,
        String(d.desiredReplicas),
        String(d.availableReplicas),
        '2m15s',
      ]);
      this.sendOutput(formatTable(headers, rows));
      return;
    }

    // 3. GET SERVICES
    if (['services', 'service', 'svc'].includes(resType)) {
      const svcs = status.services || [];
      const headers = ['NAME', 'TYPE', 'CLUSTER-IP', 'EXTERNAL-IP', 'PORT(S)', 'AGE'];
      const rows = svcs.map((s) => [
        s.name,
        s.type || 'ClusterIP',
        s.clusterIP || '10.96.14.22',
        '<none>',
        s.ports?.map((p) => `${p.port}/${p.protocol || 'TCP'}`).join(',') || '80/TCP',
        '2m15s',
      ]);
      this.sendOutput(formatTable(headers, rows));
      return;
    }

    // 4. GET EVENTS
    if (['events', 'event', 'ev'].includes(resType)) {
      const evts = status.events || [];
      if (evts.length === 0) {
        this.sendOutput(`No events found in ${this.namespace} namespace.\r\n`);
        return;
      }
      const headers = ['LAST SEEN', 'TYPE', 'REASON', 'OBJECT', 'MESSAGE'];
      const rows = evts.map((e) => [
        '15s',
        e.type,
        e.reason,
        `pod/${status.pods?.[0]?.name || 'web-app'}`,
        e.message,
      ]);
      this.sendOutput(formatTable(headers, rows));
      return;
    }

    // 5. GET CONFIGMAPS
    if (['configmaps', 'configmap', 'cm'].includes(resType)) {
      const headers = ['NAME', 'DATA', 'AGE'];
      const rows = this.attempt?.scenarioId === 'missing-configmap'
        ? [['kube-root-ca.crt', '1', '2m']]
        : [['app-config', '2', '2m'], ['kube-root-ca.crt', '1', '2m']];
      this.sendOutput(formatTable(headers, rows));
      return;
    }

    // 6. GET SECRETS
    if (['secrets', 'secret'].includes(resType)) {
      const headers = ['NAME', 'TYPE', 'DATA', 'AGE'];
      const rows = this.attempt?.scenarioId === 'ingress-tls-failure'
        ? [['default-token', 'kubernetes.io/service-account-token', '3', '2m']]
        : [['example-tls-secret', 'kubernetes.io/tls', '2', '2m'], ['default-token', 'kubernetes.io/service-account-token', '3', '2m']];
      this.sendOutput(formatTable(headers, rows));
      return;
    }

    // 7. GET INGRESS
    if (['ingress', 'ingresses', 'ing'].includes(resType)) {
      const headers = ['NAME', 'CLASS', 'HOSTS', 'ADDRESS', 'PORTS', 'AGE'];
      const rows = [['web-ingress', 'nginx', 'app.example.com', '192.168.1.100', '80, 443', '2m']];
      this.sendOutput(formatTable(headers, rows));
      return;
    }

    // 8. GET ENDPOINTS
    if (['endpoints', 'endpoint', 'ep'].includes(resType)) {
      const headers = ['NAME', 'ENDPOINTS', 'AGE'];
      const epVal = this.attempt?.scenarioId === 'service-connectivity' ? '<none>' : '10.244.0.5:80';
      const rows = [['web-service', epVal, '2m']];
      this.sendOutput(formatTable(headers, rows));
      return;
    }

    this.sendOutput(`error: the server doesn't have a resource type "${resType}"\r\n`);
  }

  async handleKubectlDescribe(args, status) {
    if (args.length === 0) {
      this.sendOutput('error: You must specify the type of resource to describe.\r\n');
      return;
    }

    const resType = args[0].toLowerCase();
    const targetName = args[1] || '';

    if (['pod', 'pods', 'po'].includes(resType)) {
      const pod = status.pods?.[0] || {
        name: targetName || `${this.namespace}-pod-crash`,
        phase: 'Running',
        ready: false,
        restarts: 4,
      };

      const scenarioId = this.attempt?.scenarioId || 'crash-loop-backoff';
      let stateReason = 'CrashLoopBackOff';
      let exitCode = '1';
      let eventMsg = 'Back-off restarting failed container';

      if (scenarioId === 'image-pull-backoff') {
        stateReason = 'ImagePullBackOff';
        exitCode = '0';
        eventMsg = 'Failed to pull image "kubementor/nonexistent-image:failure-scenario-001": rpc error: code = NotFound';
      } else if (scenarioId === 'oom-killed') {
        stateReason = 'OOMKilled';
        exitCode = '137';
        eventMsg = 'Killed process inside container nginx (limit 16Mi)';
      } else if (scenarioId === 'missing-configmap') {
        stateReason = 'CreateContainerConfigError';
        exitCode = '0';
        eventMsg = 'configmap "app-config" not found';
      }

      this.sendOutput(`Name:             ${pod.name}\r\n`);
      this.sendOutput(`Namespace:        ${this.namespace}\r\n`);
      this.sendOutput(`Priority:         0\r\n`);
      this.sendOutput(`Node:             node-1/192.168.1.10\r\n`);
      this.sendOutput(`Start Time:       ${new Date(Date.now() - 120000).toUTCString()}\r\n`);
      this.sendOutput(`Labels:           app=web-app\r\n`);
      this.sendOutput(`Status:           ${pod.phase}\r\n`);
      this.sendOutput(`IP:               10.244.0.5\r\n`);
      this.sendOutput(`Containers:\r\n`);
      this.sendOutput(`  nginx:\r\n`);
      this.sendOutput(`    Container ID:   containerd://98ab219c01\r\n`);
      this.sendOutput(`    Image:          nginx:1.25.3\r\n`);
      this.sendOutput(`    State:          Waiting\r\n`);
      this.sendOutput(`      Reason:       ${stateReason}\r\n`);
      this.sendOutput(`    Last State:     Terminated\r\n`);
      this.sendOutput(`      Reason:       ${stateReason}\r\n`);
      this.sendOutput(`      Exit Code:    ${exitCode}\r\n`);
      this.sendOutput(`    Ready:          ${pod.ready ? 'True' : 'False'}\r\n`);
      this.sendOutput(`    Restart Count:  ${pod.restarts}\r\n`);
      this.sendOutput(`    Limits:\r\n`);
      this.sendOutput(`      memory:       ${scenarioId === 'oom-killed' ? '16Mi' : '256Mi'}\r\n`);
      this.sendOutput(`    Requests:\r\n`);
      this.sendOutput(`      memory:       64Mi\r\n`);
      this.sendOutput(`Events:\r\n`);
      this.sendOutput(`  Type     Reason     Age   From               Message\r\n`);
      this.sendOutput(`  ----     ------     ----  ----               -------\r\n`);
      this.sendOutput(`  Normal   Scheduled  2m    default-scheduler  Successfully assigned ${this.namespace}/${pod.name} to node-1\r\n`);
      this.sendOutput(`  Warning  BackOff    15s   kubelet            ${eventMsg}\r\n`);
      return;
    }

    if (['deployment', 'deployments', 'deploy'].includes(resType)) {
      this.sendOutput(`Name:                   web-app\r\n`);
      this.sendOutput(`Namespace:              ${this.namespace}\r\n`);
      this.sendOutput(`CreationTimestamp:      ${new Date(Date.now() - 120000).toUTCString()}\r\n`);
      this.sendOutput(`Labels:                 app=web-app\r\n`);
      this.sendOutput(`Replicas:               1 desired | 0 available | 1 total\r\n`);
      this.sendOutput(`StrategyType:           RollingUpdate\r\n`);
      this.sendOutput(`Pod Template:\r\n`);
      this.sendOutput(`  Labels:  app=web-app\r\n`);
      this.sendOutput(`  Containers:\r\n`);
      this.sendOutput(`   nginx:\r\n`);
      this.sendOutput(`    Image:      nginx:1.25.3\r\n`);
      this.sendOutput(`    Port:       80/TCP\r\n`);
      return;
    }

    if (['service', 'services', 'svc'].includes(resType)) {
      const isMismatched = this.attempt?.scenarioId === 'service-connectivity';
      this.sendOutput(`Name:              web-service\r\n`);
      this.sendOutput(`Namespace:         ${this.namespace}\r\n`);
      this.sendOutput(`Labels:            app=web-app\r\n`);
      this.sendOutput(`Selector:          ${isMismatched ? 'app=non-matching-selector-failure' : 'app=web-app'}\r\n`);
      this.sendOutput(`Type:              ClusterIP\r\n`);
      this.sendOutput(`IP:                10.96.14.22\r\n`);
      this.sendOutput(`Port:              http  80/TCP\r\n`);
      this.sendOutput(`TargetPort:        80/TCP\r\n`);
      this.sendOutput(`Endpoints:         ${isMismatched ? '<none>' : '10.244.0.5:80'}\r\n`);
      return;
    }

    this.sendOutput(`describe ${resType} output for ${targetName || 'resource'} generated.\r\n`);
  }

  async handleKubectlLogs(args, status) {
    const scenarioId = this.attempt?.scenarioId || 'crash-loop-backoff';
    const isPrevious = args.includes('--previous') || args.includes('-p');

    if (scenarioId === 'crash-loop-backoff') {
      this.sendOutput(`[STARTUP] 2026/09/13 13:20:00 Initializing Web Application framework v1.25.3\r\n`);
      this.sendOutput(`[CONFIG]  2026/09/13 13:20:01 Loading runtime parameters from environment...\r\n`);
      this.sendOutput(`\x1b[31m[FATAL]   2026/09/13 13:20:01 Application initialization failed with exit code 1.\x1b[0m\r\n`);
      this.sendOutput(`\x1b[31mError: Mandatory startup environment parameter missing or container command executed 'exit 1'.\x1b[0m\r\n`);
      return;
    }

    if (scenarioId === 'image-pull-backoff') {
      this.sendOutput(`\x1b[31mError from server (BadRequest): container "nginx" in pod "${status.pods?.[0]?.name || 'web-app'}" is waiting to start: trying and failing to pull image\x1b[0m\r\n`);
      return;
    }

    if (scenarioId === 'oom-killed') {
      this.sendOutput(`[INFO]  2026/09/13 13:21:00 Process starting with heap allocations...\r\n`);
      this.sendOutput(`[INFO]  2026/09/13 13:21:02 Allocating database connection pools and caching in memory...\r\n`);
      this.sendOutput(`\x1b[31mKilled (Out of memory threshold exceeded 16Mi limit)\x1b[0m\r\n`);
      return;
    }

    if (scenarioId === 'missing-configmap') {
      this.sendOutput(`\x1b[31mError from server (BadRequest): container "nginx" in pod "${status.pods?.[0]?.name || 'web-app'}" is waiting to start: CreateContainerConfigError: configmap "app-config" not found\x1b[0m\r\n`);
      return;
    }

    if (scenarioId === 'service-connectivity') {
      this.sendOutput(`10.244.0.1 - - [13/Sep/2026:13:22:10 +0000] "GET / HTTP/1.1" 200 612 "-" "kube-probe/1.30"\r\n`);
      this.sendOutput(`[NOTICE] Server running and listening on port 80 (PID 1)\r\n`);
      return;
    }

    if (scenarioId === 'ingress-tls-failure') {
      this.sendOutput(`2026/09/13 13:22:15 [error] 7#7: *1 SSL_do_handshake() failed (SSL: error:0A0000C1:SSL routines::no shared cipher) while SSL handshaking\r\n`);
      return;
    }

    this.sendOutput(`[INFO] 2026/09/13 13:20:00 Application healthy and listening on :80\r\n`);
  }
}

export default TerminalSession;
