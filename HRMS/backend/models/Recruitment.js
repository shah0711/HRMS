const mongoose = require('mongoose');

const recruitmentSchema = new mongoose.Schema({
  jobTitle: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true,
    enum: ['IT', 'HR', 'Finance', 'Marketing', 'Sales', 'Operations', 'Admin']
  },
  position: {
    type: String,
    required: true
  },
  jobDescription: {
    type: String,
    required: true
  },
  requirements: {
    education: [String],
    experience: {
      min: Number,
      max: Number
    },
    skills: [String],
    certifications: [String]
  },
  numberOfOpenings: {
    type: Number,
    required: true,
    default: 1
  },
  employmentType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Intern'],
    default: 'Full-time'
  },
  salaryRange: {
    min: Number,
    max: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  location: {
    type: String,
    required: true
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  postedDate: {
    type: Date,
    default: Date.now
  },
  applicationDeadline: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Draft', 'Open', 'Closed', 'On Hold', 'Filled'],
    default: 'Open'
  },
  applications: [{
    applicant: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      location: String
    },
    resume: {
      url: String,
      filename: String
    },
    coverLetter: String,
    appliedDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['New', 'Shortlisted', 'Interview Scheduled', 'Interviewed', 'Offered', 'Rejected', 'Hired', 'Withdrawn'],
      default: 'New'
    },
    interviews: [{
      round: Number,
      type: {
        type: String,
        enum: ['Phone', 'Video', 'In-person', 'Technical', 'HR']
      },
      scheduledDate: Date,
      interviewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
      },
      feedback: String,
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      status: {
        type: String,
        enum: ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled']
      }
    }],
    notes: [{
      note: String,
      addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      addedDate: {
        type: Date,
        default: Date.now
      }
    }],
    rating: {
      type: Number,
      min: 1,
      max: 5
    }
  }],
  hiringManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

recruitmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Recruitment', recruitmentSchema);
