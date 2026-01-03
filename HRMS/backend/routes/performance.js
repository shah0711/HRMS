const express = require('express');
const router = express.Router();
const { db } = require('../config/db');
const { performances, employees } = require('../../shared/schema');
const { eq, inArray } = require('drizzle-orm');
const { auth } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.post('/evaluation', auth, roleCheck('admin', 'hr', 'manager'), async (req, res) => {
  try {
    const {
      employeeId, reviewStartDate, reviewEndDate, reviewType,
      criteria, goals, strengths, areasOfImprovement,
      trainingRecommendations, reviewerComments, managerComments
    } = req.body;

    const criteriaArr = criteria || [];
    const overallRating = criteriaArr.length > 0 
      ? (criteriaArr.reduce((sum, c) => sum + (c.rating || 0), 0) / criteriaArr.length).toFixed(1)
      : null;

    const [evaluation] = await db.insert(performances).values({
      employeeId,
      reviewStartDate,
      reviewEndDate,
      reviewType,
      reviewerId: req.user.employee?.id || req.user.userId,
      criteria: criteriaArr,
      goals: goals || [],
      overallRating,
      strengths: strengths || [],
      areasOfImprovement: areasOfImprovement || [],
      trainingRecommendations: trainingRecommendations || [],
      reviewerComments,
      managerComments,
      status: 'Draft'
    }).returning();
    
    res.status(201).json({
      success: true,
      message: 'Performance evaluation created successfully',
      data: evaluation
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating evaluation', error: error.message });
  }
});

router.get('/employee/:id', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await db.select().from(performances).where(eq(performances.employeeId, id));
    
    result.sort((a, b) => new Date(b.reviewEndDate) - new Date(a.reviewEndDate));
    
    res.json({
      success: true,
      count: result.length,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching evaluations', error: error.message });
  }
});

router.get('/pending/all', auth, roleCheck('admin', 'hr', 'manager'), async (req, res) => {
  try {
    const allPerformances = await db.select().from(performances);
    const pending = allPerformances.filter(p => 
      ['Draft', 'Submitted', 'Under Review'].includes(p.status)
    );
    
    const allEmployees = await db.select().from(employees);
    const employeeMap = new Map(allEmployees.map(e => [e.id, e]));
    
    const enriched = pending.map(p => ({
      ...p,
      employee: employeeMap.get(p.employeeId) || null,
      reviewer: employeeMap.get(p.reviewerId) || null
    }));
    
    enriched.sort((a, b) => new Date(b.reviewEndDate) - new Date(a.reviewEndDate));
    
    res.json({
      success: true,
      count: enriched.length,
      data: enriched
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching pending evaluations', error: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [evaluation] = await db.select().from(performances).where(eq(performances.id, id));
    
    if (!evaluation) {
      return res.status(404).json({ success: false, message: 'Evaluation not found' });
    }

    const allEmployees = await db.select().from(employees);
    const employeeMap = new Map(allEmployees.map(e => [e.id, e]));

    res.json({
      success: true,
      data: {
        ...evaluation,
        employee: employeeMap.get(evaluation.employeeId) || null,
        reviewer: employeeMap.get(evaluation.reviewerId) || null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching evaluation', error: error.message });
  }
});

router.put('/:id', auth, roleCheck('admin', 'hr', 'manager'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updateData = { ...req.body, updatedAt: new Date() };
    
    if (updateData.criteria && Array.isArray(updateData.criteria)) {
      updateData.overallRating = (updateData.criteria.reduce((sum, c) => sum + (c.rating || 0), 0) / updateData.criteria.length).toFixed(1);
    }

    const [evaluation] = await db.update(performances)
      .set(updateData)
      .where(eq(performances.id, id))
      .returning();

    if (!evaluation) {
      return res.status(404).json({ success: false, message: 'Evaluation not found' });
    }

    res.json({
      success: true,
      message: 'Evaluation updated successfully',
      data: evaluation
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating evaluation', error: error.message });
  }
});

router.put('/:id/acknowledge', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [evaluation] = await db.select().from(performances).where(eq(performances.id, id));

    if (!evaluation) {
      return res.status(404).json({ success: false, message: 'Evaluation not found' });
    }

    const [updated] = await db.update(performances)
      .set({
        acknowledged: true,
        acknowledgedDate: new Date(),
        status: 'Acknowledged',
        employeeComments: req.body.employeeComments || evaluation.employeeComments,
        updatedAt: new Date()
      })
      .where(eq(performances.id, id))
      .returning();

    res.json({
      success: true,
      message: 'Evaluation acknowledged successfully',
      data: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error acknowledging evaluation', error: error.message });
  }
});

router.get('/analytics/:employeeId', auth, async (req, res) => {
  try {
    const employeeId = parseInt(req.params.employeeId);
    const evaluations = await db.select().from(performances).where(eq(performances.employeeId, employeeId));

    if (evaluations.length === 0) {
      return res.json({ success: true, message: 'No evaluations found', data: null });
    }

    const avgRating = evaluations.reduce((sum, e) => sum + parseFloat(e.overallRating || 0), 0) / evaluations.length;
    const ratingTrend = evaluations.map(e => ({
      date: e.reviewEndDate,
      rating: parseFloat(e.overallRating || 0)
    }));

    const allStrengths = evaluations.flatMap(e => e.strengths || []);
    const allImprovements = evaluations.flatMap(e => e.areasOfImprovement || []);

    res.json({
      success: true,
      data: {
        totalEvaluations: evaluations.length,
        averageRating: Math.round(avgRating * 10) / 10,
        latestRating: parseFloat(evaluations[0].overallRating || 0),
        ratingTrend,
        strengths: [...new Set(allStrengths)],
        areasOfImprovement: [...new Set(allImprovements)]
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching analytics', error: error.message });
  }
});

module.exports = router;
