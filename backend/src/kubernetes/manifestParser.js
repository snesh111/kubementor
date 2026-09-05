import yaml from 'js-yaml';

const ALLOWED_KINDS = ['Deployment', 'Service', 'ConfigMap', 'Secret', 'Ingress', 'Pod'];

const CLUSTER_SCOPED_KINDS = [
  'ClusterRole',
  'ClusterRoleBinding',
  'CustomResourceDefinition',
  'Namespace',
  'Node',
  'PersistentVolume',
  'StorageClass',
  'APIService',
  'MutatingWebhookConfiguration',
  'ValidatingWebhookConfiguration',
];

export const parseAndEnforceSandboxManifests = (rawYamlContent, sandboxNamespace) => {
  if (!rawYamlContent || typeof rawYamlContent !== 'string') {
    return { valid: false, error: 'Empty or invalid YAML content provided.', documents: [] };
  }

  let rawDocs = [];
  try {
    rawDocs = yaml.loadAll(rawYamlContent).filter((doc) => doc && typeof doc === 'object');
  } catch (err) {
    return { valid: false, error: `YAML Parsing Error: ${err.message}`, documents: [] };
  }

  if (rawDocs.length === 0) {
    return { valid: false, error: 'No valid Kubernetes resource objects found in YAML file.', documents: [] };
  }

  const processedDocs = [];

  for (const doc of rawDocs) {
    const kind = doc.kind;

    if (!kind) {
      return { valid: false, error: 'Kubernetes resource object missing required "kind" field.', documents: [] };
    }

    if (CLUSTER_SCOPED_KINDS.includes(kind)) {
      return {
        valid: false,
        error: `Security Violation: Cluster-scoped resource '${kind}' is strictly prohibited in the Sandbox environment.`,
        documents: [],
      };
    }

    if (!ALLOWED_KINDS.includes(kind)) {
      return {
        valid: false,
        error: `Resource kind '${kind}' is not supported in this version of KubeMentor Sandbox. Supported kinds: ${ALLOWED_KINDS.join(', ')}.`,
        documents: [],
      };
    }

    // Clone document and override metadata.namespace to sandboxNamespace
    const enforcedDoc = JSON.parse(JSON.stringify(doc));
    if (!enforcedDoc.metadata) {
      enforcedDoc.metadata = {};
    }

    // Override namespace to backend-controlled sandbox namespace
    enforcedDoc.metadata.namespace = sandboxNamespace;

    processedDocs.push(enforcedDoc);
  }

  return {
    valid: true,
    error: null,
    documents: processedDocs,
  };
};

export default { parseAndEnforceSandboxManifests };
