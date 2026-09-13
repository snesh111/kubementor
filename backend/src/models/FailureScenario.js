import mongoose from 'mongoose';

const failureScenarioSchema = new mongoose.Schema(
  {
    scenarioId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['Reliability', 'Performance', 'Security'],
    },
    difficulty: {
      type: String,
      required: true,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
    },
    objective: {
      type: String,
      required: true,
    },
    expectedFailure: {
      type: String,
      required: true,
    },
    supportedResourceKinds: [
      {
        type: String,
      },
    ],
    enabled: {
      type: Boolean,
      default: true,
    },
    injectionType: {
      type: String,
      required: true,
    },
    concept: {
      whatIsIt: {
        type: String,
        default: '',
      },
      whyItHappens: [
        {
          type: String,
        },
      ],
      whenItHappens: {
        type: String,
        default: '',
      },
      productionImpact: {
        type: String,
        default: '',
      },
      troubleshootingPlaybook: [
        {
          stepNumber: Number,
          title: String,
          description: String,
          command: String,
        },
      ],
      commonMistakes: [
        {
          type: String,
        },
      ],
      proTips: [
        {
          type: String,
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

failureScenarioSchema.methods.toResponseObject = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

export const FailureScenario = mongoose.model('FailureScenario', failureScenarioSchema);
export default FailureScenario;
