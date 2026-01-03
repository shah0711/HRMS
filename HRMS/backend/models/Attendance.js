const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  checkIn: {
    time: {
      type: Date,
      required: true
    },
    location: String,
    notes: String
  },
  checkOut: {
    time: Date,
    location: String,
    notes: String
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Late', 'Half-day', 'On Leave'],
    default: 'Present'
  },
  workHours: {
    type: Number,
    default: 0
  },
  isLate: {
    type: Boolean,
    default: false
  },
  lateBy: {
    type: Number, // minutes
    default: 0
  },
  earlyLeave: {
    type: Boolean,
    default: false
  },
  earlyLeaveBy: {
    type: Number, // minutes
    default: 0
  },
  overtime: {
    type: Number, // minutes
    default: 0
  },
  remarks: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for employee and date
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

// Calculate work hours before saving
attendanceSchema.pre('save', function(next) {
  if (this.checkIn.time && this.checkOut.time) {
    const diff = this.checkOut.time - this.checkIn.time;
    this.workHours = Math.round(diff / (1000 * 60 * 60) * 100) / 100; // hours with 2 decimals
  }
  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);
