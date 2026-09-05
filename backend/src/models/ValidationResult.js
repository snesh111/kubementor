import mongoose from 'mongoose';

const checkSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    expected: { type: mongoose.Schema.Types.Mixed, required: true },
    actual: { type: mongoose.Schema.Types.Mixed, required: true },
    status: { type: String, enum: ['PASS', 'FAIL', 'PARTIAL'], required: true },
    description: { type: String },
  },
  { _id: false }
);

const validationResultSchema = new mongoose.Schema(
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
    scenarioAttempt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ScenarioAttempt',
      required: true,
      index: true,
    },
    beforeContextSnapshot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ContextSnapshot',
      required: true,
    },
    afterContextSnapshot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ContextSnapshot',
      required: true,
    },
    scenario: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['PASS', 'FAIL', 'PARTIAL'],
      required: true,
    },
    summary: {
      type: String,
      required: true,
    },
    checks: [checkSchema],
    attemptNumber: {
      type: Number,
      default: 1,
    },
    durationMs: {
      type: Number,
      default: 0,
    },
    validatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

validationResultSchema.methods.toResponseObject = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

export const ValidationResult = mongoose.model('ValidationResult', validationResultSchema);
export default ValidationResult;
