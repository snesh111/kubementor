import mongoose from 'mongoose';

const executionLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    scenarioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Scenario',
    },
    actionType: {
      type: String,
      enum: ['deploy', 'logs_analysis', 'troubleshoot', 'scenario_verify'],
      required: true,
    },
    inputPayload: {
      type: String,
    },
    outputResult: {
      type: mongoose.Schema.Types.Mixed,
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'pending'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

export const ExecutionLog = mongoose.model('ExecutionLog', executionLogSchema);
export default ExecutionLog;
