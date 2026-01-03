# HRMS Setup and Installation Guide

## Project Overview
This HRMS (Human Resource Management System) is built with:
- **Backend**: Node.js, Express.js, MongoDB
- **Frontend**: React.js
- **Authentication**: JWT (JSON Web Tokens)
- **Architecture**: RESTful API

## Prerequisites
Before you begin, ensure you have the following installed:
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager
- Git (optional)

## Installation Steps

### 1. Install Backend Dependencies
```powershell
# Navigate to project root
cd "c:\Users\TIRTH SHAH\Desktop\HRMS"

# Install backend dependencies
npm install
```

### 2. Install Frontend Dependencies
```powershell
# Navigate to frontend directory
cd frontend

# Install frontend dependencies
npm install

# Return to project root
cd ..
```

### 3. Configure Environment Variables
```powershell
# Create .env file from example
Copy-Item .env.example .env

# Edit .env file with your configuration
# Update the following:
# - MONGODB_URI (your MongoDB connection string)
# - JWT_SECRET (generate a strong random string)
# - PORT (default: 5000)
```

### 4. Start MongoDB
If using local MongoDB:
```powershell
# Start MongoDB service
net start MongoDB
```

For MongoDB Atlas (cloud), use the connection string provided by Atlas.

### 5. Seed Initial Data (Optional)
Create initial admin user by running the register endpoint or create manually in MongoDB.

### 6. Run the Application

#### Option 1: Run Backend and Frontend Separately

**Terminal 1 - Backend:**
```powershell
# From project root
npm run dev
```

**Terminal 2 - Frontend:**
```powershell
# From project root
cd frontend
npm start
```

#### Option 2: Run Both Concurrently (if configured)
```powershell
# From project root
npm run dev-all
```

## Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## Default Login Credentials

After seeding data or manual creation:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hrms.com | admin123 |
| HR | hr@hrms.com | hr123 |
| Manager | manager@hrms.com | manager123 |
| Employee | employee@hrms.com | employee123 |

## API Endpoints Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/change-password` - Change password

### Employees
- `GET /api/employees` - Get all employees
- `GET /api/employees/:id` - Get employee by ID
- `POST /api/employees` - Create employee (HR/Admin)
- `PUT /api/employees/:id` - Update employee (HR/Admin)
- `DELETE /api/employees/:id` - Delete employee (Admin)

### Attendance
- `POST /api/attendance/checkin` - Check in
- `POST /api/attendance/checkout` - Check out
- `GET /api/attendance/user/:userId` - Get user attendance
- `GET /api/attendance/report` - Get attendance report (HR/Admin/Manager)
- `GET /api/attendance/today` - Get today's attendance

### Leaves
- `POST /api/leaves` - Apply for leave
- `GET /api/leaves/user/:userId` - Get user leaves
- `GET /api/leaves/pending` - Get pending leaves (Manager/HR/Admin)
- `PUT /api/leaves/:id/approve` - Approve leave (Manager/HR/Admin)
- `PUT /api/leaves/:id/reject` - Reject leave (Manager/HR/Admin)
- `GET /api/leaves/balance/:userId` - Get leave balance

### Payroll
- `POST /api/payroll/calculate` - Calculate payroll (HR/Admin)
- `GET /api/payroll/employee/:id` - Get employee payroll
- `POST /api/payroll/generate` - Generate payslips (HR/Admin)
- `PUT /api/payroll/:id` - Update payroll (HR/Admin)
- `GET /api/payroll/monthly/:month/:year` - Get monthly payroll (HR/Admin)

### Performance
- `POST /api/performance/evaluation` - Create evaluation (Manager/HR/Admin)
- `GET /api/performance/employee/:id` - Get employee evaluations
- `GET /api/performance/:id` - Get evaluation by ID
- `PUT /api/performance/:id` - Update evaluation (Manager/HR/Admin)
- `PUT /api/performance/:id/acknowledge` - Acknowledge evaluation (Employee)
- `GET /api/performance/analytics/:employeeId` - Get performance analytics

### Recruitment
- `POST /api/recruitment/jobs` - Create job posting (HR/Admin)
- `GET /api/recruitment/jobs` - Get all job postings
- `GET /api/recruitment/jobs/:id` - Get job by ID
- `PUT /api/recruitment/jobs/:id` - Update job (HR/Admin)
- `POST /api/recruitment/applications` - Submit application
- `GET /api/recruitment/applications/:jobId` - Get applications (HR/Admin/Manager)
- `PUT /api/recruitment/applications/:jobId/:applicationId` - Update application
- `POST /api/recruitment/applications/:jobId/:applicationId/interview` - Schedule interview

## Project Structure

```
HRMS/
├── backend/
│   ├── config/
│   │   └── db.js                 # Database configuration
│   ├── models/                   # Mongoose models
│   │   ├── User.js
│   │   ├── Employee.js
│   │   ├── Attendance.js
│   │   ├── Leave.js
│   │   ├── Payroll.js
│   │   ├── Performance.js
│   │   └── Recruitment.js
│   ├── routes/                   # API routes
│   │   ├── auth.js
│   │   ├── employees.js
│   │   ├── attendance.js
│   │   ├── leaves.js
│   │   ├── payroll.js
│   │   ├── performance.js
│   │   └── recruitment.js
│   ├── middleware/               # Custom middleware
│   │   ├── auth.js
│   │   └── roleCheck.js
│   └── server.js                 # Main server file
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/           # React components
│   │   │   ├── Navbar.js
│   │   │   └── Navbar.css
│   │   ├── pages/                # Page components
│   │   │   ├── Login.js
│   │   │   ├── Dashboard.js
│   │   │   ├── Employees.js
│   │   │   ├── Attendance.js
│   │   │   ├── Leaves.js
│   │   │   ├── Payroll.js
│   │   │   ├── Performance.js
│   │   │   └── Recruitment.js
│   │   ├── services/
│   │   │   └── api.js           # API service layer
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
├── uploads/                      # File uploads directory
├── .env.example                  # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

## Features by Module

### 1. User Management
- ✅ JWT authentication
- ✅ Role-based access control (Admin, HR, Manager, Employee)
- ✅ Password change functionality
- ✅ User profile management

### 2. Employee Management
- ✅ CRUD operations for employees
- ✅ Department and position tracking
- ✅ Employee search and filtering
- ✅ Document management
- ✅ Emergency contact information

### 3. Attendance System
- ✅ Daily check-in/check-out
- ✅ Attendance tracking
- ✅ Late arrival detection
- ✅ Overtime calculation
- ✅ Attendance reports

### 4. Leave Management
- ✅ Multiple leave types support
- ✅ Leave application workflow
- ✅ Manager approval system
- ✅ Leave balance tracking
- ✅ Leave history

### 5. Payroll System
- ✅ Automatic salary calculation
- ✅ Allowances and deductions
- ✅ Overtime pay calculation
- ✅ Payslip generation
- ✅ Monthly payroll processing

### 6. Performance Management
- ✅ Performance evaluation forms
- ✅ Multiple criteria rating system
- ✅ Goal tracking
- ✅ 360-degree feedback
- ✅ Performance analytics

### 7. Recruitment Module
- ✅ Job posting management
- ✅ Application tracking
- ✅ Interview scheduling
- ✅ Candidate status management
- ✅ Resume management

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check connection string in .env file
- Verify network connectivity for MongoDB Atlas

### Port Already in Use
```powershell
# Check what's using port 5000
netstat -ano | findstr :5000

# Kill the process if needed
taskkill /PID <PID> /F
```

### Module Not Found Errors
```powershell
# Clear node_modules and reinstall
Remove-Item -Recurse -Force node_modules
npm install
```

## Next Steps

1. **Customize the System**: Modify models and routes based on your requirements
2. **Add More Features**: Implement file uploads, email notifications, etc.
3. **Enhance UI**: Improve frontend design with a UI library like Material-UI
4. **Add Tests**: Implement unit and integration tests
5. **Deploy**: Deploy to production (Heroku, AWS, Azure, etc.)

## Support

For issues or questions, please refer to:
- README.md for general information
- API documentation above
- Code comments in source files

## License

ISC License
