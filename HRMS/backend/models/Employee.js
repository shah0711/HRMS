const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
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
  joiningDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  employmentType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Intern'],
    default: 'Full-time'
  },
  salary: {
    basic: {
      type: Number,
      required: true
    },
    allowances: {
      hra: { type: Number, default: 0 },
      transport: { type: Number, default: 0 },
      medical: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    },
    deductions: {
      tax: { type: Number, default: 0 },
      providentFund: { type: Number, default: 0 },
      insurance: { type: Number, default: 0 }
    }
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  documents: [{
    name: String,
    type: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  status: {
    type: String,
    enum: ['Active', 'On Leave', 'Terminated', 'Resigned'],
    default: 'Active'
  },
  profileImage: {
    type: String
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

// Update the updatedAt timestamp before saving
employeeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Employee', employeeSchema);
