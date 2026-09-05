import mongoose from 'mongoose';

const scenarioSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner',
    },
    description: {
      type: String,
      required: true,
    },
    faultyManifestYaml: {
      type: String,
      required: true,
    },
    solutionYaml: {
      type: String,
      required: true,
    },
    expectedStatus: {
      type: String,
      default: 'Running',
    },
  },
  { timestamps: true }
);

export const Scenario = mongoose.model('Scenario', scenarioSchema);
export default Scenario;
