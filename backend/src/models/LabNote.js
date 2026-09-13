import mongoose from 'mongoose';

const labNoteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project reference is required'],
      index: true,
    },
    labId: {
      type: String,
      required: [true, 'Lab scenario ID is required'],
      trim: true,
      index: true,
    },
    evidence: {
      type: String,
      default: '',
      maxlength: [10000, 'Evidence notes cannot exceed 10,000 characters'],
    },
    hypothesis: {
      type: String,
      default: '',
      maxlength: [10000, 'Hypothesis notes cannot exceed 10,000 characters'],
    },
    rootCause: {
      type: String,
      default: '',
      maxlength: [10000, 'Root cause notes cannot exceed 10,000 characters'],
    },
    plannedFix: {
      type: String,
      default: '',
      maxlength: [10000, 'Planned fix notes cannot exceed 10,000 characters'],
    },
    result: {
      type: String,
      default: '',
      maxlength: [10000, 'Result notes cannot exceed 10,000 characters'],
    },
    generalNotes: {
      type: String,
      default: '',
      maxlength: [20000, 'General notes cannot exceed 20,000 characters'],
    },
    lastSavedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index: One active investigation note set per user per lab scenario
labNoteSchema.index({ user: 1, labId: 1 }, { unique: true });

labNoteSchema.methods.toResponseObject = function () {
  const obj = this.toObject();
  return {
    _id: obj._id,
    id: obj._id,
    userId: obj.user,
    projectId: obj.project,
    labId: obj.labId,
    evidence: obj.evidence || '',
    hypothesis: obj.hypothesis || '',
    rootCause: obj.rootCause || '',
    plannedFix: obj.plannedFix || '',
    result: obj.result || '',
    generalNotes: obj.generalNotes || '',
    lastSavedAt: obj.lastSavedAt,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
};

export const LabNote = mongoose.model('LabNote', labNoteSchema);
export default LabNote;
