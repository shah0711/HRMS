const express = require('express');
const router = express.Router();
const Performance = require('../models/Performance');
const Employee = require('../models/Employee');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// @route   POST /api/performance/evaluation
// @desc    Create performance evaluation
// @access  Private (Manager, HR, Admin)
router.post('/evaluation', auth, roleCheck('admin', 'hr', 'manager'), async (req, res) => {
  try {
    const evaluationData = {
      ...req.body,
      reviewer: req.user.employee._id
    };

    const evaluation = await Performance.create(evaluationData);
    
    res.status(201).json({
      success: true,
      message: 'Performance evaluation created successfully',
      data: evaluation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating evaluation',
      error: error.message
    });
  }
});

// @route   GET /api/performance/employee/:id
// @desc    Get evaluations for an employee
// @access  Private
router.get('/employee/:id', auth, async (req, res) => {
  try {
    const evaluations = await Performance.find({ employee: req.params.id })
      .populate('employee', 'firstName lastName employeeId')
      .populate('reviewer', 'firstName lastName')
      .sort({ 'reviewPeriod.endDate': -1 });
    
    res.status(200).json({
      success: true,
      count: evaluations.length,
      data: evaluations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching evaluations',
      error: error.message
    });
  }
});

// @route   GET /api/performance/:id
// @desc    Get single evaluation
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const evaluation = await Performance.findById(req.params.id)
      .populate('employee', 'firstName lastName employeeId department position')
      .populate('reviewer', 'firstName lastName');
    
    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: 'Evaluation not found'
      });
    }

    res.status(200).json({
      success: true,
      data: evaluation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching evaluation',
      error: error.message
    });
  }
});

// @route   PUT /api/performance/:id
// @desc    Update evaluation
// @access  Private (Manager, HR, Admin)
router.put('/:id', auth, roleCheck('admin', 'hr', 'manager'), async (req, res) => {
  try {
    const evaluation = await Performance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: 'Evaluation not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Evaluation updated successfully',
      data: evaluation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating evaluation',
      error: error.message
    });
  }
});

// @route   PUT /api/performance/:id/acknowledge
// @desc    Acknowledge evaluation (employee)
// @access  Private
router.put('/:id/acknowledge', auth, async (req, res) => {
  try {
    const evaluation = await Performance.findById(req.params.id);

    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: 'Evaluation not found'
      });
    }

    // Check if user is the employee being evaluated
    if (evaluation.employee.toString() !== req.user.employee._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to acknowledge this evaluation'
      });
    }

    evaluation.acknowledgement = {
      acknowledged: true,
      acknowledgedDate: Date.now(),
      signature: req.body.signature
    };
    evaluation.status = 'Acknowledged';
    evaluation.employeeComments = req.body.employeeComments || evaluation.employeeComments;

    await evaluation.save();

    res.status(200).json({
      success: true,
      message: 'Evaluation acknowledged successfully',
      data: evaluation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error acknowledging evaluation',
      error: error.message
    });
  }
});

// @route   GET /api/performance/pending
// @desc    Get pending evaluations
// @access  Private (Manager, HR, Admin)
router.get('/pending/all', auth, roleCheck('admin', 'hr', 'manager'), async (req, res) => {
  try {
    const evaluations = await Performance.find({
      status: { $in: ['Draft', 'Submitted', 'Under Review'] }
    })
      .populate('employee', 'firstName lastName employeeId department')
      .populate('reviewer', 'firstName lastName')
      .sort({ 'reviewPeriod.endDate': -1 });
    
    res.status(200).json({
      success: true,
      count: evaluations.length,
      data: evaluations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching pending evaluations',
      error: error.message
    });
  }
});

// @route   GET /api/performance/analytics/:employeeId
// @desc    Get performance analytics for an employee
// @access  Private
router.get('/analytics/:employeeId', auth, async (req, res) => {
  try {
    const evaluations = await Performance.find({ employee: req.params.employeeId });

    if (evaluations.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No evaluations found',
        data: null
      });
    }

    // Calculate analytics
    const avgRating = evaluations.reduce((sum, e) => sum + e.overallRating, 0) / evaluations.length;
    const ratingTrend = evaluations.map(e => ({
      date: e.reviewPeriod.endDate,
      rating: e.overallRating
    }));

    const allStrengths = evaluations.flatMap(e => e.strengths);
    const allImprovements = evaluations.flatMap(e => e.areasOfImprovement);

    res.status(200).json({
      success: true,
      data: {
        totalEvaluations: evaluations.length,
        averageRating: Math.round(avgRating * 10) / 10,
        latestRating: evaluations[0].overallRating,
        ratingTrend,
        strengths: [...new Set(allStrengths)],
        areasOfImprovement: [...new Set(allImprovements)]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics',
      error: error.message
    });
  }
});

module.exports = router;
