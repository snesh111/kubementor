export class BaseInjector {
  constructor(scenarioId, scenarioName) {
    this.scenarioId = scenarioId;
    this.scenarioName = scenarioName;
  }

  async prepare(namespace, deploymentRecord) {
    throw new Error('prepare() method must be implemented by concrete injector.');
  }

  async inject(namespace, deploymentRecord) {
    throw new Error('inject() method must be implemented by concrete injector.');
  }

  async verifyFailure(namespace, deploymentRecord) {
    throw new Error('verifyFailure() method must be implemented by concrete injector.');
  }

  async restore(namespace, originalConfig) {
    throw new Error('restore() method must be implemented by concrete injector.');
  }
}

export default BaseInjector;
