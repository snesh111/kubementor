export const APP_NAME = 'KubeMentor';

export const K8S_RESOURCE_TYPES = {
  POD: 'Pod',
  DEPLOYMENT: 'Deployment',
  SERVICE: 'Service',
  CONFIGMAP: 'ConfigMap',
  SECRET: 'Secret',
  INGRESS: 'Ingress',
  PERSISTENT_VOLUME_CLAIM: 'PersistentVolumeClaim',
};

export const POD_STATUSES = {
  RUNNING: 'Running',
  PENDING: 'Pending',
  FAILED: 'Failed',
  CRASH_LOOP_BACK_OFF: 'CrashLoopBackOff',
  IMAGE_PULL_BACK_OFF: 'ImagePullBackOff',
  CONTAINER_CREATING: 'ContainerCreating',
  TERMINATING: 'Terminating',
};

export const SCENARIO_DIFFICULTIES = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
};
