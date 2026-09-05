import mongoose from 'mongoose';

const projectFileSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project reference is required'],
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner reference is required'],
      index: true,
    },
    originalName: {
      type: String,
      required: [true, 'Original filename is required'],
      trim: true,
    },
    storedName: {
      type: String,
      required: [true, 'Stored filename is required'],
      trim: true,
    },
    fileType: {
      type: String,
      enum: ['yaml', 'dockerfile', 'other'],
      default: 'yaml',
    },
    mimeType: {
      type: String,
      required: true,
      default: 'text/plain',
    },
    size: {
      type: Number,
      required: [true, 'File size is required'],
    },
    content: {
      type: String,
      required: [true, 'File content is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Method to return clean response metadata object
projectFileSchema.methods.toResponseObject = function (includeContent = true) {
  const obj = this.toObject();
  const result = {
    _id: obj._id,
    id: obj._id,
    projectId: obj.project,
    originalName: obj.originalName,
    storedName: obj.storedName,
    fileType: obj.fileType,
    mimeType: obj.mimeType,
    size: obj.size,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };

  if (includeContent) {
    result.content = obj.content;
  }

  return result;
};

export const ProjectFile = mongoose.model('ProjectFile', projectFileSchema);
export default ProjectFile;
