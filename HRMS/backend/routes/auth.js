const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/db');
const { users, employees } = require('../../shared/schema');
const { eq } = require('drizzle-orm');
const { auth } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'hrms_secret_key_2024';

router.post('/register', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    const existingUser = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    if (existingUser.length > 0) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const [newUser] = await db.insert(users).values({
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || 'employee'
    }).returning();
    
    const token = jwt.sign({ userId: newUser.id, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: { id: newUser.id, email: newUser.email, role: newUser.role },
        token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }
    
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is inactive' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    await db.update(users).set({ lastLogin: new Date() }).where(eq(users.id, user.id));
    
    let employee = null;
    if (user.employeeId) {
      const [emp] = await db.select().from(employees).where(eq(employees.id, user.employeeId));
      employee = emp || null;
    }
    
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: { id: user.id, email: user.email, role: user.role, employee },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const [user] = await db.select({
      id: users.id,
      email: users.email,
      role: users.role,
      employeeId: users.employeeId,
      isActive: users.isActive
    }).from(users).where(eq(users.id, req.user.userId));
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current and new password' });
    }
    
    const [user] = await db.select().from(users).where(eq(users.id, req.user.userId));
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, req.user.userId));
    
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;
