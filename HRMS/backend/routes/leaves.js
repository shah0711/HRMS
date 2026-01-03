const express = require('express');
const router = express.Router();
const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// @route   POST /api/leaves
// @desc    Apply for leave
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const leaveData = {
      ...req.body,
      employee: req.user.employee._id
    };

    const leave = await Leave.create(leaveData);
    
    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully',
      data: leave
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error applying for leave',
      error: error.message
    });
  }
});

// @route   GET /api/leaves/user/:userId
// @desc    Get leaves for a user
// @access  Private
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { status, year } = req.query;
    let query = { employee: req.params.userId };

    if (status) query.status = status;
    if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);
      query.startDate = { $gte: startDate, $lte: endDate };
    }

    const leaves = await Leave.find(query)
      .populate('employee', 'firstName lastName employeeId')
      .populate('approvedBy', 'email')
      .sort({ appliedDate: -1 });
    
    res.status(200).json({
      success: true,
      count: leaves.length,
      data: leaves
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching leaves',
      error: error.message
    });
  }
});

// @route   GET /api/leaves/pending
// @desc    Get all pending leaves (for managers/HR)
// @access  Private (Manager, HR, Admin)
router.get('/pending', auth, roleCheck('admin', 'hr', 'manager'), async (req, res) => {
  try {
    const leaves = await Leave.find({ status: 'Pending' })
      .populate('employee', 'firstName lastName employeeId department')
      .sort({ appliedDate: -1 });
    
    res.status(200).json({
      success: true,
      count: leaves.length,
      data: leaves
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching pending leaves',
      error: error.message
    });
  }
});

// @route   PUT /api/leaves/:id/approve
// @desc    Approve leave
// @access  Private (Manager, HR, Admin)
router.put('/:id/approve', auth, roleCheck('admin', 'hr', 'manager'), async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave not found'
      });
    }

    if (leave.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Leave has already been processed'
      });
    }

    leave.status = 'Approved';
    leave.approvedBy = req.user.id;
    leave.approvedDate = Date.now();
    
    if (req.body.comment) {
      leave.comments.push({
        user: req.user.id,
        comment: req.body.comment
      });
    }

    await leave.save();

    res.status(200).json({
      success: true,
      message: 'Leave approved successfully',
      data: leave
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error approving leave',
      error: error.message
    });
  }
});

// @route   PUT /api/leaves/:id/reject
// @desc    Reject leave
// @access  Private (Manager, HR, Admin)
router.put('/:id/reject', auth, roleCheck('admin', 'hr', 'manager'), async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave not found'
      });
    }

    if (leave.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Leave has already been processed'
      });
    }

    leave.status = 'Rejected';
    leave.approvedBy = req.user.id;
    leave.approvedDate = Date.now();
    leave.rejectionReason = rejectionReason;

    await leave.save();

    res.status(200).json({
      success: true,
      message: 'Leave rejected',
      data: leave
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error rejecting leave',
      error: error.message
    });
  }
});

// @route   GET /api/leaves/balance/:userId
// @desc    Get leave balance for a user
// @access  Private
router.get('/balance/:userId', auth, async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear, 11, 31);

    const leaves = await Leave.find({
      employee: req.params.userId,
      status: { $in: ['Approved', 'Pending'] },
      startDate: { $gte: startDate, $lte: endDate }
    });

    // Calculate totals by leave type
    const balance = {};
    const leaveTypes = ['Sick Leave', 'Casual Leave', 'Annual Leave', 'Maternity Leave', 'Paternity Leave'];
    
    leaveTypes.forEach(type => {
      const total = leaves
        .filter(leave => leave.leaveType === type)
        .reduce((sum, leave) => sum + leave.numberOfDays, 0);
      balance[type] = total;
    });

    res.status(200).json({
      success: true,
      data: balance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching leave balance',
      error: error.message
    });
  }
});

module.exports = router;
