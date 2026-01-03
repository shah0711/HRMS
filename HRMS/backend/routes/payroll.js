const express = require('express');
const router = express.Router();
const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const moment = require('moment');

// @route   POST /api/payroll/calculate
// @desc    Calculate and create payroll
// @access  Private (HR, Admin)
router.post('/calculate', auth, roleCheck('admin', 'hr'), async (req, res) => {
  try {
    const { employeeId, month, year } = req.body;

    // Check if payroll already exists
    const existingPayroll = await Payroll.findOne({
      employee: employeeId,
      month,
      year
    });

    if (existingPayroll) {
      return res.status(400).json({
        success: false,
        message: 'Payroll already exists for this period'
      });
    }

    // Get employee details
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Get attendance for the month
    const startDate = moment({ year, month: month - 1, day: 1 }).startOf('day');
    const endDate = moment(startDate).endOf('month');
    
    const attendance = await Attendance.find({
      employee: employeeId,
      date: { $gte: startDate.toDate(), $lte: endDate.toDate() }
    });

    const workingDays = endDate.date();
    const presentDays = attendance.filter(a => a.status === 'Present').length;
    const absentDays = attendance.filter(a => a.status === 'Absent').length;
    const leaveDays = attendance.filter(a => a.status === 'On Leave').length;
    const overtimeHours = attendance.reduce((sum, a) => sum + (a.overtime || 0), 0) / 60; // Convert to hours

    // Calculate overtime pay
    const overtimePay = (employee.salary.basic / (workingDays * 8)) * overtimeHours * 1.5;

    // Create payroll
    const payroll = await Payroll.create({
      employee: employeeId,
      month,
      year,
      basicSalary: employee.salary.basic,
      allowances: employee.salary.allowances,
      deductions: employee.salary.deductions,
      attendance: {
        workingDays,
        presentDays,
        absentDays,
        leaveDays,
        overtimeHours
      },
      overtimePay,
      generatedBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Payroll calculated successfully',
      data: payroll
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error calculating payroll',
      error: error.message
    });
  }
});

// @route   GET /api/payroll/employee/:id
// @desc    Get payroll for an employee
// @access  Private
router.get('/employee/:id', auth, async (req, res) => {
  try {
    const { year } = req.query;
    let query = { employee: req.params.id };

    if (year) {
      query.year = parseInt(year);
    }

    const payrolls = await Payroll.find(query)
      .populate('employee', 'firstName lastName employeeId')
      .sort({ year: -1, month: -1 });
    
    res.status(200).json({
      success: true,
      count: payrolls.length,
      data: payrolls
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching payroll',
      error: error.message
    });
  }
});

// @route   POST /api/payroll/generate
// @desc    Generate payslips for all employees
// @access  Private (HR, Admin)
router.post('/generate', auth, roleCheck('admin', 'hr'), async (req, res) => {
  try {
    const { month, year, department } = req.body;

    let query = { status: 'Active' };
    if (department) query.department = department;

    const employees = await Employee.find(query);
    const results = [];

    for (const employee of employees) {
      try {
        // Check if payroll already exists
        const existingPayroll = await Payroll.findOne({
          employee: employee._id,
          month,
          year
        });

        if (existingPayroll) {
          results.push({
            employeeId: employee.employeeId,
            status: 'skipped',
            message: 'Payroll already exists'
          });
          continue;
        }

        // Get attendance for the month
        const startDate = moment({ year, month: month - 1, day: 1 }).startOf('day');
        const endDate = moment(startDate).endOf('month');
        
        const attendance = await Attendance.find({
          employee: employee._id,
          date: { $gte: startDate.toDate(), $lte: endDate.toDate() }
        });

        const workingDays = endDate.date();
        const presentDays = attendance.filter(a => a.status === 'Present').length;
        const absentDays = attendance.filter(a => a.status === 'Absent').length;
        const leaveDays = attendance.filter(a => a.status === 'On Leave').length;
        const overtimeHours = attendance.reduce((sum, a) => sum + (a.overtime || 0), 0) / 60;

        const overtimePay = (employee.salary.basic / (workingDays * 8)) * overtimeHours * 1.5;

        await Payroll.create({
          employee: employee._id,
          month,
          year,
          basicSalary: employee.salary.basic,
          allowances: employee.salary.allowances,
          deductions: employee.salary.deductions,
          attendance: {
            workingDays,
            presentDays,
            absentDays,
            leaveDays,
            overtimeHours
          },
          overtimePay,
          generatedBy: req.user.id
        });

        results.push({
          employeeId: employee.employeeId,
          status: 'success',
          message: 'Payroll generated'
        });
      } catch (err) {
        results.push({
          employeeId: employee.employeeId,
          status: 'error',
          message: err.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Payroll generation completed',
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating payrolls',
      error: error.message
    });
  }
});

// @route   PUT /api/payroll/:id
// @desc    Update payroll status
// @access  Private (HR, Admin)
router.put('/:id', auth, roleCheck('admin', 'hr'), async (req, res) => {
  try {
    const { status, paymentDate, paymentMethod, remarks } = req.body;

    const payroll = await Payroll.findByIdAndUpdate(
      req.params.id,
      { status, paymentDate, paymentMethod, remarks },
      { new: true, runValidators: true }
    );

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payroll updated successfully',
      data: payroll
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating payroll',
      error: error.message
    });
  }
});

// @route   GET /api/payroll/monthly/:month/:year
// @desc    Get all payrolls for a specific month
// @access  Private (HR, Admin)
router.get('/monthly/:month/:year', auth, roleCheck('admin', 'hr'), async (req, res) => {
  try {
    const { month, year } = req.params;
    
    const payrolls = await Payroll.find({
      month: parseInt(month),
      year: parseInt(year)
    }).populate('employee', 'firstName lastName employeeId department');
    
    res.status(200).json({
      success: true,
      count: payrolls.length,
      data: payrolls
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching payrolls',
      error: error.message
    });
  }
});

module.exports = router;
