import mongoose from 'mongoose';

const aiMentorResponseSchema = new mongoose.Schema(
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
    contextSnapshot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ContextSnapshot',
    },
    mode: {
      type: String,
      enum: ['diagnose', 'hint', 'explain', 'concept', 'chat'],
      default: 'diagnose',
    },
    hintLevel: {
      type: Number,
      default: null,
    },
    response: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

aiMentorResponseSchema.methods.toResponseObject = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

export const AIMentorResponse = mongoose.model('AIMentorResponse', aiMentorResponseSchema);
export default AIMentorResponse;
