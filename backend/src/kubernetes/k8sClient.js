import k8s from '@kubernetes/client-node';

class KubernetesClientWrapper {
  constructor() {
    this.kc = new k8s.KubeConfig();
    this.isConnected = false;
    this.isLive = false;
    this.coreV1Api = null;
    this.appsV1Api = null;
    this.networkingV1Api = null;

    this.init();
  }

  init() {
    try {
      // Load config from standard environment or local kubeconfig (~/.kube/config)
      this.kc.loadFromDefault();
      this.coreV1Api = this.kc.makeApiClient(k8s.CoreV1Api);
      this.appsV1Api = this.kc.makeApiClient(k8s.AppsV1Api);
      this.networkingV1Api = this.kc.makeApiClient(k8s.NetworkingV1Api);
      this.isConnected = true;
      console.log('[K8s Client] Loaded local/cluster KubeConfig.');
    } catch (err) {
      console.warn('[K8s Client] Default KubeConfig not found. Fallback sandbox engine active.', err.message);
      this.isConnected = false;
    }
  }

  async verifyConnection() {
    if (!this.isConnected || !this.coreV1Api) {
      this.isLive = false;
      return false;
    }

    try {
      await this.coreV1Api.getAPIResources();
      this.isLive = true;
      this.isConnected = true;
      return true;
    } catch (err) {
      this.isConnected = false;
      this.isLive = false;
      console.warn(`[K8s Client] Kubernetes cluster offline or unreachable (${err.message}). Sandbox simulation engine active.`);
      return false;
    }
  }
}

export const k8sClientWrapper = new KubernetesClientWrapper();
export default k8sClientWrapper;
