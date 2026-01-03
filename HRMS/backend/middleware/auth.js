const jwt = require('jsonwebtoken');
const { db } = require('../config/db');
const { users, employees } = require('../../shared/schema');
const { eq } = require('drizzle-orm');

const JWT_SECRET = process.env.JWT_SECRET || 'hrms_secret_key_2024';

const auth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      const [user] = await db.select().from(users).where(eq(users.id, decoded.userId));
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User account is inactive'
        });
      }

      let employee = null;
      if (user.employeeId) {
        const [emp] = await db.select().from(employees).where(eq(employees.id, user.employeeId));
        employee = emp || null;
      }

      req.user = { 
        userId: user.id, 
        role: user.role, 
        email: user.email,
        employee 
      };
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token is invalid or expired'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = { auth };
