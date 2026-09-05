import mongoose from 'mongoose';

const analysisReportSchema = new mongoose.Schema(
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
    analyzedFiles: [
      {
        fileId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'ProjectFile',
        },
        originalName: String,
      },
    ],
    analyzedAt: {
      type: Date,
      default: Date.now,
    },
    overallScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    categoryScores: {
      security: { type: Number, required: true, min: 0, max: 100 },
      reliability: { type: Number, required: true, min: 0, max: 100 },
      performance: { type: Number, required: true, min: 0, max: 100 },
      bestPractices: { type: Number, required: true, min: 0, max: 100 },
    },
    categoryDeductions: {
      security: [
        {
          title: String,
          deduction: Number,
          resource: String,
        },
      ],
      reliability: [
        {
          title: String,
          deduction: Number,
          resource: String,
        },
      ],
      performance: [
        {
          title: String,
          deduction: Number,
          resource: String,
        },
      ],
      bestPractices: [
        {
          title: String,
          deduction: Number,
          resource: String,
        },
      ],
    },
    findings: [
      {
        ruleId: String,
        category: String,
        severity: {
          type: String,
          enum: ['Critical', 'High', 'Medium', 'Low', 'Info'],
          default: 'Info',
        },
        title: String,
        description: String,
        deduction: Number,
        resource: String,
        container: String,
        recommendation: String,
      },
    ],
    recommendations: [
      {
        type: String,
      },
    ],
    analyzerVersion: {
      type: String,
      default: '1.0.0',
    },
  },
  {
    timestamps: true,
  }
);

// Method to return clean response object
analysisReportSchema.methods.toResponseObject = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

export const AnalysisReport = mongoose.model('AnalysisReport', analysisReportSchema);
export default AnalysisReport;
