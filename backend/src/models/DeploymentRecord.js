import mongoose from 'mongoose';

const deploymentRecordSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project reference is required'],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    namespace: {
      type: String,
      required: [true, 'Sandbox namespace is required'],
      trim: true,
    },
    fileIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProjectFile',
      },
    ],
    resources: [
      {
        kind: String,
        name: String,
        status: { type: String, default: 'Applied' },
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'deploying', 'running', 'failed', 'stopped'],
      default: 'pending',
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    errorMessage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

deploymentRecordSchema.methods.toResponseObject = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

export const DeploymentRecord = mongoose.model('DeploymentRecord', deploymentRecordSchema);
export default DeploymentRecord;
