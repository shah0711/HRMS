const express = require('express');
const router = express.Router();
const { db } = require('../config/db');
const { employees } = require('../../shared/schema');
const { eq, ilike, or, and } = require('drizzle-orm');
const { auth } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.get('/', auth, async (req, res) => {
  try {
    const { department, status, search } = req.query;
    
    let result = await db.select().from(employees);
    
    if (department) {
      result = result.filter(e => e.department === department);
    }
    if (status) {
      result = result.filter(e => e.status === status);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(e => 
        e.firstName.toLowerCase().includes(searchLower) ||
        e.lastName.toLowerCase().includes(searchLower) ||
        e.employeeCode.toLowerCase().includes(searchLower) ||
        e.email.toLowerCase().includes(searchLower)
      );
    }
    
    res.json({
      success: true,
      count: result.length,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching employees', error: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const [employee] = await db.select().from(employees).where(eq(employees.id, parseInt(req.params.id)));
    
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching employee', error: error.message });
  }
});

router.post('/', auth, roleCheck('admin', 'hr'), async (req, res) => {
  try {
    const {
      employeeCode, firstName, lastName, email, phone,
      dateOfBirth, gender, address, department, position,
      joiningDate, employmentType, basicSalary, allowances,
      deductions, managerId, emergencyContact, status, profileImage
    } = req.body;

    const [employee] = await db.insert(employees).values({
      employeeCode,
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone,
      dateOfBirth,
      gender,
      address: address || {},
      department,
      position,
      joiningDate: joiningDate || new Date().toISOString().split('T')[0],
      employmentType: employmentType || 'Full-time',
      basicSalary,
      allowances: allowances || {},
      deductions: deductions || {},
      managerId,
      emergencyContact: emergencyContact || {},
      status: status || 'Active',
      profileImage
    }).returning();
    
    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: employee
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating employee', error: error.message });
  }
});

router.put('/:id', auth, roleCheck('admin', 'hr'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updateData = { ...req.body, updatedAt: new Date() };
    
    const [employee] = await db.update(employees)
      .set(updateData)
      .where(eq(employees.id, id))
      .returning();

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: employee
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating employee', error: error.message });
  }
});

router.delete('/:id', auth, roleCheck('admin'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [employee] = await db.delete(employees).where(eq(employees.id, id)).returning();

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.json({ success: true, message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting employee', error: error.message });
  }
});

router.get('/department/:department', auth, async (req, res) => {
  try {
    const result = await db.select().from(employees).where(eq(employees.department, req.params.department));
    
    res.json({
      success: true,
      count: result.length,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching employees', error: error.message });
  }
});

module.exports = router;
