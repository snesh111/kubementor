import mongoose from 'mongoose';

const aiConversationSchema = new mongoose.Schema(
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
    messages: [
      {
        role: {
          type: String,
          enum: ['user', 'assistant', 'system'],
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        mode: {
          type: String,
          enum: ['diagnose', 'hint', 'explain', 'concept', 'chat'],
          default: 'chat',
        },
        hintLevel: {
          type: Number,
          default: null,
        },
        confidence: {
          type: String,
          enum: ['high', 'medium', 'low', null],
          default: null,
        },
        evidence: [String],
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

aiConversationSchema.methods.toResponseObject = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

export const AIConversation = mongoose.model('AIConversation', aiConversationSchema);
export default AIConversation;
