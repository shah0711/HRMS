const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const moment = require('moment');

// @route   POST /api/attendance/checkin
// @desc    Check in
// @access  Private
router.post('/checkin', auth, async (req, res) => {
  try {
    const { location, notes } = req.body;
    const today = moment().startOf('day');
    
    // Check if already checked in today
    const existingAttendance = await Attendance.findOne({
      employee: req.user.employee._id,
      date: today.toDate()
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Already checked in today'
      });
    }

    // Create attendance record
    const attendance = await Attendance.create({
      employee: req.user.employee._id,
      date: today.toDate(),
      checkIn: {
        time: new Date(),
        location,
        notes
      },
      status: 'Present'
    });

    res.status(201).json({
      success: true,
      message: 'Checked in successfully',
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking in',
      error: error.message
    });
  }
});

// @route   POST /api/attendance/checkout
// @desc    Check out
// @access  Private
router.post('/checkout', auth, async (req, res) => {
  try {
    const { location, notes } = req.body;
    const today = moment().startOf('day');
    
    // Find today's attendance
    const attendance = await Attendance.findOne({
      employee: req.user.employee._id,
      date: today.toDate()
    });

    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: 'No check-in found for today'
      });
    }

    if (attendance.checkOut.time) {
      return res.status(400).json({
        success: false,
        message: 'Already checked out today'
      });
    }

    // Update with checkout time
    attendance.checkOut = {
      time: new Date(),
      location,
      notes
    };
    
    await attendance.save();

    res.status(200).json({
      success: true,
      message: 'Checked out successfully',
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking out',
      error: error.message
    });
  }
});

// @route   GET /api/attendance/user/:userId
// @desc    Get attendance for a user
// @access  Private
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = { employee: req.params.userId };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendance = await Attendance.find(query).sort({ date: -1 });
    
    res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance',
      error: error.message
    });
  }
});

// @route   GET /api/attendance/report
// @desc    Get attendance report
// @access  Private (HR, Admin, Manager)
router.get('/report', auth, roleCheck('admin', 'hr', 'manager'), async (req, res) => {
  try {
    const { department, startDate, endDate } = req.query;
    
    let matchQuery = {};
    if (startDate && endDate) {
      matchQuery.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const pipeline = [
      { $match: matchQuery },
      {
        $lookup: {
          from: 'employees',
          localField: 'employee',
          foreignField: '_id',
          as: 'employeeDetails'
        }
      },
      { $unwind: '$employeeDetails' }
    ];

    if (department) {
      pipeline.push({
        $match: { 'employeeDetails.department': department }
      });
    }

    pipeline.push({
      $group: {
        _id: '$employee',
        employeeName: { $first: { $concat: ['$employeeDetails.firstName', ' ', '$employeeDetails.lastName'] } },
        department: { $first: '$employeeDetails.department' },
        totalPresent: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
        totalAbsent: { $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] } },
        totalLate: { $sum: { $cond: ['$isLate', 1, 0] } },
        totalWorkHours: { $sum: '$workHours' },
        totalOvertime: { $sum: '$overtime' }
      }
    });

    const report = await Attendance.aggregate(pipeline);
    
    res.status(200).json({
      success: true,
      count: report.length,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating report',
      error: error.message
    });
  }
});

// @route   GET /api/attendance/today
// @desc    Get today's attendance
// @access  Private
router.get('/today', auth, async (req, res) => {
  try {
    const today = moment().startOf('day');
    
    const attendance = await Attendance.findOne({
      employee: req.user.employee._id,
      date: today.toDate()
    });

    res.status(200).json({
      success: true,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching today\'s attendance',
      error: error.message
    });
  }
});

module.exports = router;
