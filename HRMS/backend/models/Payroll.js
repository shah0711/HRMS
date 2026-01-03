const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  basicSalary: {
    type: Number,
    required: true
  },
  allowances: {
    hra: { type: Number, default: 0 },
    transport: { type: Number, default: 0 },
    medical: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },
  deductions: {
    tax: { type: Number, default: 0 },
    providentFund: { type: Number, default: 0 },
    insurance: { type: Number, default: 0 },
    loanRepayment: { type: Number, default: 0 },
    lateDeduction: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },
  attendance: {
    workingDays: { type: Number, required: true },
    presentDays: { type: Number, required: true },
    absentDays: { type: Number, default: 0 },
    leaveDays: { type: Number, default: 0 },
    overtimeHours: { type: Number, default: 0 }
  },
  overtimePay: {
    type: Number,
    default: 0
  },
  grossSalary: {
    type: Number,
    required: true
  },
  totalDeductions: {
    type: Number,
    required: true
  },
  netSalary: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Draft', 'Processed', 'Paid', 'On Hold'],
    default: 'Draft'
  },
  paymentDate: Date,
  paymentMethod: {
    type: String,
    enum: ['Bank Transfer', 'Cash', 'Cheque']
  },
  remarks: String,
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  generatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for employee, month, and year
payrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

// Calculate totals before saving
payrollSchema.pre('save', function(next) {
  // Calculate gross salary
  const totalAllowances = Object.values(this.allowances).reduce((sum, val) => sum + val, 0);
  this.grossSalary = this.basicSalary + totalAllowances + this.overtimePay;
  
  // Calculate total deductions
  this.totalDeductions = Object.values(this.deductions).reduce((sum, val) => sum + val, 0);
  
  // Calculate net salary
  this.netSalary = this.grossSalary - this.totalDeductions;
  
  next();
});

module.exports = mongoose.model('Payroll', payrollSchema);
