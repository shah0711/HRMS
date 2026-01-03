const express = require('express');
const router = express.Router();
const { db } = require('../config/db');
const { payrolls, employees, attendance } = require('../../shared/schema');
const { eq, and } = require('drizzle-orm');
const { auth } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.post('/calculate', auth, roleCheck('admin', 'hr'), async (req, res) => {
  try {
    const { employeeId, month, year } = req.body;

    const existing = await db.select().from(payrolls)
      .where(and(
        eq(payrolls.employeeId, employeeId),
        eq(payrolls.month, month),
        eq(payrolls.year, year)
      ));

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Payroll already exists for this period' });
    }

    const [employee] = await db.select().from(employees).where(eq(employees.id, employeeId));
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const daysInMonth = new Date(year, month, 0).getDate();
    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
    const monthEnd = `${year}-${String(month).padStart(2, '0')}-${daysInMonth}`;
    
    let attendanceRecords = await db.select().from(attendance).where(eq(attendance.employeeId, employeeId));
    attendanceRecords = attendanceRecords.filter(a => a.date >= monthStart && a.date <= monthEnd);

    const workingDays = daysInMonth;
    const presentDays = attendanceRecords.filter(a => a.status === 'Present').length;
    const absentDays = attendanceRecords.filter(a => a.status === 'Absent').length;
    const leaveDays = attendanceRecords.filter(a => a.status === 'On Leave').length;
    const overtimeHours = attendanceRecords.reduce((sum, a) => sum + (a.overtime || 0), 0) / 60;

    const basicSalary = parseFloat(employee.basicSalary);
    const allowances = employee.allowances || {};
    const deductions = employee.deductions || {};
    
    const totalAllowances = Object.values(allowances).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    const overtimePay = (basicSalary / (workingDays * 8)) * overtimeHours * 1.5;
    const grossSalary = basicSalary + totalAllowances + overtimePay;
    const totalDeductions = Object.values(deductions).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    const netSalary = grossSalary - totalDeductions;

    const [payroll] = await db.insert(payrolls).values({
      employeeId,
      month,
      year,
      basicSalary: basicSalary.toString(),
      allowances,
      deductions,
      workingDays,
      presentDays,
      absentDays,
      leaveDays,
      overtimeHours: overtimeHours.toString(),
      overtimePay: overtimePay.toString(),
      grossSalary: grossSalary.toString(),
      totalDeductions: totalDeductions.toString(),
      netSalary: netSalary.toString(),
      generatedById: req.user.userId
    }).returning();

    res.status(201).json({
      success: true,
      message: 'Payroll calculated successfully',
      data: payroll
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error calculating payroll', error: error.message });
  }
});

router.get('/employee/:id', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { year } = req.query;
    
    let result = await db.select().from(payrolls).where(eq(payrolls.employeeId, id));
    
    if (year) {
      result = result.filter(p => p.year === parseInt(year));
    }
    
    result.sort((a, b) => (b.year - a.year) || (b.month - a.month));
    
    res.json({
      success: true,
      count: result.length,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching payroll', error: error.message });
  }
});

router.post('/generate', auth, roleCheck('admin', 'hr'), async (req, res) => {
  try {
    const { month, year, department } = req.body;
    
    let allEmployees = await db.select().from(employees).where(eq(employees.status, 'Active'));
    
    if (department) {
      allEmployees = allEmployees.filter(e => e.department === department);
    }

    const results = [];

    for (const employee of allEmployees) {
      try {
        const existing = await db.select().from(payrolls)
          .where(and(
            eq(payrolls.employeeId, employee.id),
            eq(payrolls.month, month),
            eq(payrolls.year, year)
          ));

        if (existing.length > 0) {
          results.push({ employeeCode: employee.employeeCode, status: 'skipped', message: 'Payroll already exists' });
          continue;
        }

        const daysInMonth = new Date(year, month, 0).getDate();
        const basicSalary = parseFloat(employee.basicSalary);
        const allowances = employee.allowances || {};
        const deductions = employee.deductions || {};
        
        const totalAllowances = Object.values(allowances).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
        const grossSalary = basicSalary + totalAllowances;
        const totalDeductions = Object.values(deductions).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
        const netSalary = grossSalary - totalDeductions;

        await db.insert(payrolls).values({
          employeeId: employee.id,
          month,
          year,
          basicSalary: basicSalary.toString(),
          allowances,
          deductions,
          workingDays: daysInMonth,
          presentDays: daysInMonth,
          absentDays: 0,
          leaveDays: 0,
          overtimeHours: '0',
          overtimePay: '0',
          grossSalary: grossSalary.toString(),
          totalDeductions: totalDeductions.toString(),
          netSalary: netSalary.toString(),
          generatedById: req.user.userId
        });

        results.push({ employeeCode: employee.employeeCode, status: 'success', message: 'Payroll generated' });
      } catch (err) {
        results.push({ employeeCode: employee.employeeCode, status: 'error', message: err.message });
      }
    }

    res.json({
      success: true,
      message: 'Payroll generation completed',
      data: results
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error generating payrolls', error: error.message });
  }
});

router.put('/:id', auth, roleCheck('admin', 'hr'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, paymentDate, paymentMethod, remarks } = req.body;

    const [payroll] = await db.update(payrolls)
      .set({ status, paymentDate, paymentMethod, remarks })
      .where(eq(payrolls.id, id))
      .returning();

    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Payroll not found' });
    }

    res.json({
      success: true,
      message: 'Payroll updated successfully',
      data: payroll
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating payroll', error: error.message });
  }
});

router.get('/monthly/:month/:year', auth, roleCheck('admin', 'hr'), async (req, res) => {
  try {
    const month = parseInt(req.params.month);
    const year = parseInt(req.params.year);
    
    const result = await db.select().from(payrolls)
      .where(and(eq(payrolls.month, month), eq(payrolls.year, year)));
    
    const allEmployees = await db.select().from(employees);
    const employeeMap = new Map(allEmployees.map(e => [e.id, e]));
    
    const enriched = result.map(p => ({
      ...p,
      employee: employeeMap.get(p.employeeId) || null
    }));
    
    res.json({
      success: true,
      count: enriched.length,
      data: enriched
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching payrolls', error: error.message });
  }
});

module.exports = router;
