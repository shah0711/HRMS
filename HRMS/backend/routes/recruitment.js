const express = require('express');
const router = express.Router();
const { db } = require('../config/db');
const { recruitments, employees, users } = require('../../shared/schema');
const { eq } = require('drizzle-orm');
const { auth } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.post('/jobs', auth, roleCheck('admin', 'hr'), async (req, res) => {
  try {
    const {
      jobTitle, department, position, jobDescription, requirements,
      numberOfOpenings, employmentType, salaryRange, location, applicationDeadline,
      hiringManagerId
    } = req.body;

    const [job] = await db.insert(recruitments).values({
      jobTitle,
      department,
      position,
      jobDescription,
      requirements: requirements || {},
      numberOfOpenings: numberOfOpenings || 1,
      employmentType: employmentType || 'Full-time',
      salaryRange: salaryRange || {},
      location,
      postedById: req.user.userId,
      applicationDeadline,
      status: 'Open',
      applications: [],
      hiringManagerId
    }).returning();
    
    res.status(201).json({
      success: true,
      message: 'Job posting created successfully',
      data: job
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating job posting', error: error.message });
  }
});

router.get('/jobs', async (req, res) => {
  try {
    const { status, department, location } = req.query;
    
    let result = await db.select().from(recruitments);
    
    if (status) {
      result = result.filter(j => j.status === status);
    }
    if (department) {
      result = result.filter(j => j.department === department);
    }
    if (location) {
      result = result.filter(j => j.location.toLowerCase().includes(location.toLowerCase()));
    }
    
    result.sort((a, b) => new Date(b.postedDate) - new Date(a.postedDate));
    
    res.json({
      success: true,
      count: result.length,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching job postings', error: error.message });
  }
});

router.get('/jobs/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [job] = await db.select().from(recruitments).where(eq(recruitments.id, id));
    
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job posting not found' });
    }

    res.json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching job posting', error: error.message });
  }
});

router.put('/jobs/:id', auth, roleCheck('admin', 'hr'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updateData = { ...req.body, updatedAt: new Date() };

    const [job] = await db.update(recruitments)
      .set(updateData)
      .where(eq(recruitments.id, id))
      .returning();

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job posting not found' });
    }

    res.json({
      success: true,
      message: 'Job posting updated successfully',
      data: job
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating job posting', error: error.message });
  }
});

router.post('/applications', async (req, res) => {
  try {
    const { jobId, applicant, resume, coverLetter } = req.body;

    const [job] = await db.select().from(recruitments).where(eq(recruitments.id, parseInt(jobId)));
    
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job posting not found' });
    }

    if (job.status !== 'Open') {
      return res.status(400).json({ success: false, message: 'This job posting is not accepting applications' });
    }

    const applications = job.applications || [];
    const existingApplication = applications.find(app => app.applicant?.email === applicant.email);

    if (existingApplication) {
      return res.status(400).json({ success: false, message: 'You have already applied for this position' });
    }

    applications.push({
      id: Date.now().toString(),
      applicant,
      resume,
      coverLetter,
      status: 'New',
      appliedDate: new Date(),
      interviews: [],
      notes: []
    });

    await db.update(recruitments)
      .set({ applications, updatedAt: new Date() })
      .where(eq(recruitments.id, parseInt(jobId)));

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error submitting application', error: error.message });
  }
});

router.get('/applications/:jobId', auth, roleCheck('admin', 'hr', 'manager'), async (req, res) => {
  try {
    const jobId = parseInt(req.params.jobId);
    const { status } = req.query;
    
    const [job] = await db.select().from(recruitments).where(eq(recruitments.id, jobId));
    
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job posting not found' });
    }

    let applications = job.applications || [];
    
    if (status) {
      applications = applications.filter(app => app.status === status);
    }

    res.json({
      success: true,
      count: applications.length,
      data: applications
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching applications', error: error.message });
  }
});

router.put('/applications/:jobId/:applicationId', auth, roleCheck('admin', 'hr', 'manager'), async (req, res) => {
  try {
    const jobId = parseInt(req.params.jobId);
    const { applicationId } = req.params;
    const { status, note } = req.body;

    const [job] = await db.select().from(recruitments).where(eq(recruitments.id, jobId));
    
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job posting not found' });
    }

    const applications = job.applications || [];
    const appIndex = applications.findIndex(app => app.id === applicationId);
    
    if (appIndex === -1) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (status) {
      applications[appIndex].status = status;
    }

    if (note) {
      if (!applications[appIndex].notes) applications[appIndex].notes = [];
      applications[appIndex].notes.push({
        note,
        addedById: req.user.userId,
        addedDate: new Date()
      });
    }

    await db.update(recruitments)
      .set({ applications, updatedAt: new Date() })
      .where(eq(recruitments.id, jobId));

    res.json({
      success: true,
      message: 'Application updated successfully',
      data: applications[appIndex]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating application', error: error.message });
  }
});

router.post('/applications/:jobId/:applicationId/interview', auth, roleCheck('admin', 'hr', 'manager'), async (req, res) => {
  try {
    const jobId = parseInt(req.params.jobId);
    const { applicationId } = req.params;

    const [job] = await db.select().from(recruitments).where(eq(recruitments.id, jobId));
    
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job posting not found' });
    }

    const applications = job.applications || [];
    const appIndex = applications.findIndex(app => app.id === applicationId);
    
    if (appIndex === -1) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (!applications[appIndex].interviews) applications[appIndex].interviews = [];
    applications[appIndex].interviews.push({
      ...req.body,
      id: Date.now().toString(),
      status: 'Scheduled'
    });
    applications[appIndex].status = 'Interview Scheduled';

    await db.update(recruitments)
      .set({ applications, updatedAt: new Date() })
      .where(eq(recruitments.id, jobId));

    res.status(201).json({
      success: true,
      message: 'Interview scheduled successfully',
      data: applications[appIndex]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error scheduling interview', error: error.message });
  }
});

module.exports = router;
