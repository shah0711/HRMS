const express = require('express');
const router = express.Router();
const Recruitment = require('../models/Recruitment');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// @route   POST /api/recruitment/jobs
// @desc    Create job posting
// @access  Private (HR, Admin)
router.post('/jobs', auth, roleCheck('admin', 'hr'), async (req, res) => {
  try {
    const jobData = {
      ...req.body,
      postedBy: req.user.id
    };

    const job = await Recruitment.create(jobData);
    
    res.status(201).json({
      success: true,
      message: 'Job posting created successfully',
      data: job
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating job posting',
      error: error.message
    });
  }
});

// @route   GET /api/recruitment/jobs
// @desc    Get all job postings
// @access  Public/Private
router.get('/jobs', async (req, res) => {
  try {
    const { status, department, location } = req.query;
    let query = {};

    if (status) query.status = status;
    if (department) query.department = department;
    if (location) query.location = { $regex: location, $options: 'i' };

    const jobs = await Recruitment.find(query)
      .populate('postedBy', 'email')
      .populate('hiringManager', 'firstName lastName')
      .sort({ postedDate: -1 });
    
    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching job postings',
      error: error.message
    });
  }
});

// @route   GET /api/recruitment/jobs/:id
// @desc    Get single job posting
// @access  Public/Private
router.get('/jobs/:id', async (req, res) => {
  try {
    const job = await Recruitment.findById(req.params.id)
      .populate('postedBy', 'email')
      .populate('hiringManager', 'firstName lastName email');
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    res.status(200).json({
      success: true,
      data: job
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching job posting',
      error: error.message
    });
  }
});

// @route   PUT /api/recruitment/jobs/:id
// @desc    Update job posting
// @access  Private (HR, Admin)
router.put('/jobs/:id', auth, roleCheck('admin', 'hr'), async (req, res) => {
  try {
    const job = await Recruitment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Job posting updated successfully',
      data: job
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating job posting',
      error: error.message
    });
  }
});

// @route   POST /api/recruitment/applications
// @desc    Submit job application
// @access  Public
router.post('/applications', async (req, res) => {
  try {
    const { jobId, applicant, resume, coverLetter } = req.body;

    const job = await Recruitment.findById(jobId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    if (job.status !== 'Open') {
      return res.status(400).json({
        success: false,
        message: 'This job posting is not accepting applications'
      });
    }

    // Check if already applied
    const existingApplication = job.applications.find(
      app => app.applicant.email === applicant.email
    );

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this position'
      });
    }

    job.applications.push({
      applicant,
      resume,
      coverLetter,
      status: 'New'
    });

    await job.save();

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error submitting application',
      error: error.message
    });
  }
});

// @route   GET /api/recruitment/applications/:jobId
// @desc    Get applications for a job
// @access  Private (HR, Admin, Manager)
router.get('/applications/:jobId', auth, roleCheck('admin', 'hr', 'manager'), async (req, res) => {
  try {
    const { status } = req.query;
    
    const job = await Recruitment.findById(req.params.jobId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    let applications = job.applications;
    
    if (status) {
      applications = applications.filter(app => app.status === status);
    }

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching applications',
      error: error.message
    });
  }
});

// @route   PUT /api/recruitment/applications/:jobId/:applicationId
// @desc    Update application status
// @access  Private (HR, Admin, Manager)
router.put('/applications/:jobId/:applicationId', auth, roleCheck('admin', 'hr', 'manager'), async (req, res) => {
  try {
    const { status, note } = req.body;

    const job = await Recruitment.findById(req.params.jobId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    const application = job.applications.id(req.params.applicationId);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    if (status) {
      application.status = status;
    }

    if (note) {
      application.notes.push({
        note,
        addedBy: req.user.id
      });
    }

    await job.save();

    res.status(200).json({
      success: true,
      message: 'Application updated successfully',
      data: application
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating application',
      error: error.message
    });
  }
});

// @route   POST /api/recruitment/applications/:jobId/:applicationId/interview
// @desc    Schedule interview
// @access  Private (HR, Admin, Manager)
router.post('/applications/:jobId/:applicationId/interview', auth, roleCheck('admin', 'hr', 'manager'), async (req, res) => {
  try {
    const job = await Recruitment.findById(req.params.jobId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    const application = job.applications.id(req.params.applicationId);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    application.interviews.push(req.body);
    application.status = 'Interview Scheduled';

    await job.save();

    res.status(201).json({
      success: true,
      message: 'Interview scheduled successfully',
      data: application
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error scheduling interview',
      error: error.message
    });
  }
});

module.exports = router;
