import mongoose from 'mongoose';

const recentValidationSchema = new mongoose.Schema(
  {
    validationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ValidationResult',
    },
    status: {
      type: String,
      enum: ['PASS', 'FAIL', 'PARTIAL', 'ERROR'],
      required: true,
    },
    score: {
      type: Number,
      default: 0,
    },
    attemptNumber: {
      type: Number,
      default: 1,
    },
    validatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const learnerProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    scenarioId: {
      type: String,
      required: true,
      index: true,
    },
    scenarioName: {
      type: String,
      default: '',
    },
    topic: {
      type: String,
      default: 'Reliability',
      index: true,
    },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner',
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    passCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    failureCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    bestScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    latestScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    masteryState: {
      type: String,
      enum: ['NOT_STARTED', 'PRACTICING', 'COMPLETED', 'MASTERED'],
      default: 'NOT_STARTED',
      index: true,
    },
    firstAttemptAt: {
      type: Date,
      default: null,
    },
    lastAttemptAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    masteredAt: {
      type: Date,
      default: null,
    },
    recentValidations: [recentValidationSchema],
  },
  {
    timestamps: true,
  }
);

// Compound unique index per user and scenario
learnerProgressSchema.index({ user: 1, scenarioId: 1 }, { unique: true });

learnerProgressSchema.methods.toResponseObject = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

export const LearnerProgress = mongoose.model('LearnerProgress', learnerProgressSchema);
export default LearnerProgress;
