import CrashLoopInjector from './injectors/crashLoopInjector.js';
import ImagePullInjector from './injectors/imagePullInjector.js';
import OOMInjector from './injectors/oomInjector.js';
import MissingConfigMapInjector from './injectors/missingConfigMapInjector.js';
import ServiceConnectivityInjector from './injectors/serviceConnectivityInjector.js';
import IngressTlsInjector from './injectors/ingressTlsInjector.js';

class ScenarioRegistry {
  constructor() {
    this.injectors = new Map();

    this.register(new CrashLoopInjector());
    this.register(new ImagePullInjector());
    this.register(new OOMInjector());
    this.register(new MissingConfigMapInjector());
    this.register(new ServiceConnectivityInjector());
    this.register(new IngressTlsInjector());
  }

  register(injector) {
    this.injectors.set(injector.scenarioId, injector);
  }

  getInjector(scenarioId) {
    return this.injectors.get(scenarioId);
  }

  hasInjector(scenarioId) {
    return this.injectors.has(scenarioId);
  }
}

export const scenarioRegistry = new ScenarioRegistry();
export default scenarioRegistry;
