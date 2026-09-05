import mongoose from 'mongoose';

const contextSnapshotSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    deployment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeploymentRecord',
      required: true,
      index: true,
    },
    scenarioAttempt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ScenarioAttempt',
      required: true,
      index: true,
    },
    contextVersion: {
      type: String,
      default: '1.0',
    },
    context: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

contextSnapshotSchema.methods.toResponseObject = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

export const ContextSnapshot = mongoose.model('ContextSnapshot', contextSnapshotSchema);
export default ContextSnapshot;
