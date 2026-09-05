import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      minlength: [3, 'Project name must be at least 3 characters long'],
      maxlength: [100, 'Project name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Project owner is required'],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['draft', 'analyzed', 'deployed', 'archived'],
        message: '{VALUE} is not a valid project status',
      },
      default: 'draft',
    },
  },
  {
    timestamps: true,
  }
);

// Helper method to return clean object
projectSchema.methods.toResponseObject = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

export const Project = mongoose.model('Project', projectSchema);
export default Project;
