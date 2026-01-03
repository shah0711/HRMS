const express = require('express');
const router = express.Router();
const { db } = require('../config/db');
const { leaves, employees, users } = require('../../shared/schema');
const { eq, and, gte, lte } = require('drizzle-orm');
const { auth } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.post('/', auth, async (req, res) => {
  try {
    const { employeeId, leaveType, startDate, endDate, reason, documents } = req.body;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const numberOfDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    const [leave] = await db.insert(leaves).values({
      employeeId,
      leaveType,
      startDate,
      endDate,
      numberOfDays,
      reason,
      documents: documents || [],
      status: 'Pending'
    }).returning();
    
    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully',
      data: leave
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error applying for leave', error: error.message });
  }
});

router.get('/user/:userId', auth, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { status, year } = req.query;
    
    let result = await db.select().from(leaves).where(eq(leaves.employeeId, userId));
    
    if (status) {
      result = result.filter(l => l.status === status);
    }
    if (year) {
      const startOfYear = `${year}-01-01`;
      const endOfYear = `${year}-12-31`;
      result = result.filter(l => l.startDate >= startOfYear && l.startDate <= endOfYear);
    }
    
    result.sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));
    
    res.json({
      success: true,
      count: result.length,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching leaves', error: error.message });
  }
});

router.get('/pending', auth, roleCheck('admin', 'hr', 'manager'), async (req, res) => {
  try {
    let result = await db.select().from(leaves).where(eq(leaves.status, 'Pending'));
    const allEmployees = await db.select().from(employees);
    const employeeMap = new Map(allEmployees.map(e => [e.id, e]));
    
    const enriched = result.map(l => ({
      ...l,
      employee: employeeMap.get(l.employeeId) || null
    }));
    
    enriched.sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));
    
    res.json({
      success: true,
      count: enriched.length,
      data: enriched
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching pending leaves', error: error.message });
  }
});

router.put('/:id/approve', auth, roleCheck('admin', 'hr', 'manager'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [leave] = await db.select().from(leaves).where(eq(leaves.id, id));

    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave not found' });
    }

    if (leave.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Leave has already been processed' });
    }

    const comments = leave.comments || [];
    if (req.body.comment) {
      comments.push({ userId: req.user.userId, comment: req.body.comment, date: new Date() });
    }

    const [updated] = await db.update(leaves)
      .set({
        status: 'Approved',
        approvedById: req.user.userId,
        approvedDate: new Date(),
        comments
      })
      .where(eq(leaves.id, id))
      .returning();

    res.json({
      success: true,
      message: 'Leave approved successfully',
      data: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error approving leave', error: error.message });
  }
});

router.put('/:id/reject', auth, roleCheck('admin', 'hr', 'manager'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { rejectionReason } = req.body;
    
    const [leave] = await db.select().from(leaves).where(eq(leaves.id, id));

    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave not found' });
    }

    if (leave.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Leave has already been processed' });
    }

    const [updated] = await db.update(leaves)
      .set({
        status: 'Rejected',
        approvedById: req.user.userId,
        approvedDate: new Date(),
        rejectionReason
      })
      .where(eq(leaves.id, id))
      .returning();

    res.json({
      success: true,
      message: 'Leave rejected',
      data: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error rejecting leave', error: error.message });
  }
});

router.get('/balance/:userId', auth, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const currentYear = new Date().getFullYear();
    const startOfYear = `${currentYear}-01-01`;
    const endOfYear = `${currentYear}-12-31`;

    let result = await db.select().from(leaves).where(eq(leaves.employeeId, userId));
    result = result.filter(l => 
      (l.status === 'Approved' || l.status === 'Pending') &&
      l.startDate >= startOfYear && l.startDate <= endOfYear
    );

    const leaveTypes = ['Sick Leave', 'Casual Leave', 'Annual Leave', 'Maternity Leave', 'Paternity Leave'];
    const balance = {};
    
    leaveTypes.forEach(type => {
      const total = result
        .filter(l => l.leaveType === type)
        .reduce((sum, l) => sum + l.numberOfDays, 0);
      balance[type] = total;
    });

    res.json({ success: true, data: balance });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching leave balance', error: error.message });
  }
});

module.exports = router;
