import mongoose from 'mongoose';

const scenarioAttemptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    deployment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeploymentRecord',
      required: true,
      index: true,
    },
    scenarioId: {
      type: String,
      required: true,
    },
    scenarioName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['preparing', 'injecting', 'active', 'failed', 'completed', 'cancelled'],
      default: 'preparing',
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    failureInjectedAt: Date,
    expectedState: String,
    actualState: String,
    injectionDetails: {
      type: mongoose.Schema.Types.Mixed,
    },
    restorationDetails: {
      type: mongoose.Schema.Types.Mixed,
    },
    attemptNumber: {
      type: Number,
      default: 1,
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

scenarioAttemptSchema.methods.toResponseObject = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

export const ScenarioAttempt = mongoose.model('ScenarioAttempt', scenarioAttemptSchema);
export default ScenarioAttempt;
