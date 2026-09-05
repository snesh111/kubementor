import mongoose from 'mongoose';

const clusterConfigSchema = new mongoose.Schema(
  {
    clusterName: {
      type: String,
      required: true,
      default: 'KubeMentor-Simulated-Cluster',
    },
    version: {
      type: String,
      default: 'v1.28.2',
    },
    namespaces: [
      {
        type: String,
        default: ['default', 'kube-system'],
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const ClusterConfig = mongoose.model('ClusterConfig', clusterConfigSchema);
export default ClusterConfig;
