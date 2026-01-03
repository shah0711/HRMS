const express = require('express');
const router = express.Router();
const { db } = require('../config/db');
const { attendance, employees } = require('../../shared/schema');
const { eq, and, gte, lte, sql } = require('drizzle-orm');
const { auth } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.post('/checkin', auth, async (req, res) => {
  try {
    const { employeeId, location, notes } = req.body;
    const today = new Date().toISOString().split('T')[0];
    
    const existing = await db.select().from(attendance)
      .where(and(eq(attendance.employeeId, employeeId), eq(attendance.date, today)));

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Already checked in today' });
    }

    const [record] = await db.insert(attendance).values({
      employeeId,
      date: today,
      checkInTime: new Date(),
      checkInLocation: location,
      checkInNotes: notes,
      status: 'Present'
    }).returning();

    res.status(201).json({
      success: true,
      message: 'Checked in successfully',
      data: record
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error checking in', error: error.message });
  }
});

router.post('/checkout', auth, async (req, res) => {
  try {
    const { employeeId, location, notes } = req.body;
    const today = new Date().toISOString().split('T')[0];
    
    const [record] = await db.select().from(attendance)
      .where(and(eq(attendance.employeeId, employeeId), eq(attendance.date, today)));

    if (!record) {
      return res.status(400).json({ success: false, message: 'No check-in found for today' });
    }

    if (record.checkOutTime) {
      return res.status(400).json({ success: false, message: 'Already checked out today' });
    }

    const checkOutTime = new Date();
    const workHours = record.checkInTime ? 
      ((checkOutTime - new Date(record.checkInTime)) / (1000 * 60 * 60)).toFixed(2) : 0;

    const [updated] = await db.update(attendance)
      .set({
        checkOutTime,
        checkOutLocation: location,
        checkOutNotes: notes,
        workHours
      })
      .where(eq(attendance.id, record.id))
      .returning();

    res.json({
      success: true,
      message: 'Checked out successfully',
      data: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error checking out', error: error.message });
  }
});

router.get('/user/:userId', auth, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { startDate, endDate } = req.query;
    
    let result = await db.select().from(attendance).where(eq(attendance.employeeId, userId));
    
    if (startDate && endDate) {
      result = result.filter(r => r.date >= startDate && r.date <= endDate);
    }
    
    result.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    res.json({
      success: true,
      count: result.length,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching attendance', error: error.message });
  }
});

router.get('/report', auth, roleCheck('admin', 'hr', 'manager'), async (req, res) => {
  try {
    const { department, startDate, endDate } = req.query;
    
    let allAttendance = await db.select().from(attendance);
    let allEmployees = await db.select().from(employees);
    
    if (department) {
      const deptEmployees = allEmployees.filter(e => e.department === department);
      const deptEmployeeIds = deptEmployees.map(e => e.id);
      allAttendance = allAttendance.filter(a => deptEmployeeIds.includes(a.employeeId));
    }
    
    if (startDate && endDate) {
      allAttendance = allAttendance.filter(a => a.date >= startDate && a.date <= endDate);
    }
    
    const employeeMap = new Map(allEmployees.map(e => [e.id, e]));
    const report = [];
    
    const grouped = allAttendance.reduce((acc, a) => {
      if (!acc[a.employeeId]) acc[a.employeeId] = [];
      acc[a.employeeId].push(a);
      return acc;
    }, {});
    
    for (const [empId, records] of Object.entries(grouped)) {
      const emp = employeeMap.get(parseInt(empId));
      if (emp) {
        report.push({
          employeeId: empId,
          employeeName: `${emp.firstName} ${emp.lastName}`,
          department: emp.department,
          totalPresent: records.filter(r => r.status === 'Present').length,
          totalAbsent: records.filter(r => r.status === 'Absent').length,
          totalLate: records.filter(r => r.isLate).length,
          totalWorkHours: records.reduce((sum, r) => sum + parseFloat(r.workHours || 0), 0),
          totalOvertime: records.reduce((sum, r) => sum + (r.overtime || 0), 0)
        });
      }
    }
    
    res.json({
      success: true,
      count: report.length,
      data: report
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error generating report', error: error.message });
  }
});

router.get('/today', auth, async (req, res) => {
  try {
    const { employeeId } = req.query;
    const today = new Date().toISOString().split('T')[0];
    
    if (!employeeId) {
      return res.json({ success: true, data: null });
    }
    
    const [record] = await db.select().from(attendance)
      .where(and(eq(attendance.employeeId, parseInt(employeeId)), eq(attendance.date, today)));

    res.json({ success: true, data: record || null });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching today\'s attendance', error: error.message });
  }
});

module.exports = router;
