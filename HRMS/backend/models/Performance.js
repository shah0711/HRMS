const mongoose = require('mongoose');

const performanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  reviewPeriod: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  reviewType: {
    type: String,
    enum: ['Quarterly', 'Half-yearly', 'Annual', 'Probation', 'Special'],
    required: true
  },
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  criteria: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    comments: String
  }],
  goals: [{
    title: String,
    description: String,
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed', 'Delayed'],
      default: 'Not Started'
    },
    completionPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  }],
  overallRating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  strengths: [String],
  areasOfImprovement: [String],
  trainingRecommendations: [String],
  employeeComments: String,
  reviewerComments: String,
  managerComments: String,
  status: {
    type: String,
    enum: ['Draft', 'Submitted', 'Under Review', 'Completed', 'Acknowledged'],
    default: 'Draft'
  },
  nextReviewDate: Date,
  acknowledgement: {
    acknowledged: {
      type: Boolean,
      default: false
    },
    acknowledgedDate: Date,
    signature: String
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

// Calculate overall rating from criteria
performanceSchema.pre('save', function(next) {
  if (this.criteria && this.criteria.length > 0) {
    const totalRating = this.criteria.reduce((sum, item) => sum + item.rating, 0);
    this.overallRating = Math.round((totalRating / this.criteria.length) * 10) / 10;
  }
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Performance', performanceSchema);
