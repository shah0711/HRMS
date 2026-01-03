const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// @route   GET /api/employees
// @desc    Get all employees
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { department, status, search } = req.query;
    let query = {};

    if (department) query.department = department;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const employees = await Employee.find(query).populate('manager', 'firstName lastName employeeId');
    
    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching employees',
      error: error.message
    });
  }
});

// @route   GET /api/employees/:id
// @desc    Get single employee
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).populate('manager', 'firstName lastName employeeId position');
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.status(200).json({
      success: true,
      data: employee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching employee',
      error: error.message
    });
  }
});

// @route   POST /api/employees
// @desc    Create new employee
// @access  Private (HR, Admin)
router.post('/', auth, roleCheck('admin', 'hr'), async (req, res) => {
  try {
    const employee = await Employee.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: employee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating employee',
      error: error.message
    });
  }
});

// @route   PUT /api/employees/:id
// @desc    Update employee
// @access  Private (HR, Admin)
router.put('/:id', auth, roleCheck('admin', 'hr'), async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: employee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating employee',
      error: error.message
    });
  }
});

// @route   DELETE /api/employees/:id
// @desc    Delete employee
// @access  Private (Admin only)
router.delete('/:id', auth, roleCheck('admin'), async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting employee',
      error: error.message
    });
  }
});

// @route   GET /api/employees/department/:department
// @desc    Get employees by department
// @access  Private
router.get('/department/:department', auth, async (req, res) => {
  try {
    const employees = await Employee.find({ department: req.params.department });
    
    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching employees',
      error: error.message
    });
  }
});

module.exports = router;
