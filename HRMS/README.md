# HRMS - Human Resource Management System

A comprehensive web-based Human Resource Management System built with MERN stack (MongoDB, Express.js, React.js, Node.js).

## Features

### 1. User Management
- User authentication and authorization
- Role-based access control (Admin, HR, Manager, Employee)
- Secure login with JWT tokens

### 2. Employee Management
- Employee profile management
- Department and position tracking
- Employee directory with search and filters

### 3. Attendance System
- Daily check-in/check-out
- Attendance tracking and reports
- Late arrival and early departure tracking

### 4. Leave Management
- Leave application and approval workflow
- Multiple leave types (Sick, Casual, Annual, etc.)
- Leave balance tracking
- Manager approval system

### 5. Payroll System
- Salary structure management
- Automatic salary calculation
- Deductions and allowances
- Payslip generation
- Monthly payroll processing

### 6. Performance Management
- Performance evaluation forms
- Review cycles
- Goal setting and tracking
- 360-degree feedback

### 7. Recruitment Module
- Job posting management
- Applicant tracking system
- Resume management
- Interview scheduling
- Candidate status tracking

## Technology Stack

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- bcrypt for password hashing

### Frontend
- React.js
- React Router for navigation
- Axios for API calls
- CSS/Material-UI for styling

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Backend Setup
```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your configuration

# Start the server
npm run dev
```

### Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the React app
npm start
```

## Project Structure

```
HRMS/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Employee.js
│   │   ├── Attendance.js
│   │   ├── Leave.js
│   │   ├── Payroll.js
│   │   ├── Performance.js
│   │   └── Recruitment.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── employees.js
│   │   ├── attendance.js
│   │   ├── leaves.js
│   │   ├── payroll.js
│   │   ├── performance.js
│   │   └── recruitment.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── roleCheck.js
│   ├── controllers/
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── uploads/
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## API Endpoints

### Authentication
- POST /api/auth/register - Register new user
- POST /api/auth/login - User login
- GET /api/auth/me - Get current user

### Employees
- GET /api/employees - Get all employees
- POST /api/employees - Create employee
- GET /api/employees/:id - Get employee by ID
- PUT /api/employees/:id - Update employee
- DELETE /api/employees/:id - Delete employee

### Attendance
- POST /api/attendance/checkin - Check in
- POST /api/attendance/checkout - Check out
- GET /api/attendance/user/:userId - Get user attendance
- GET /api/attendance/report - Get attendance report

### Leave Management
- POST /api/leaves - Apply for leave
- GET /api/leaves/user/:userId - Get user leaves
- PUT /api/leaves/:id/approve - Approve leave
- PUT /api/leaves/:id/reject - Reject leave

### Payroll
- POST /api/payroll/calculate - Calculate salary
- GET /api/payroll/employee/:id - Get employee payroll
- POST /api/payroll/generate - Generate payslips

### Performance
- POST /api/performance/evaluation - Create evaluation
- GET /api/performance/employee/:id - Get employee evaluations
- PUT /api/performance/:id - Update evaluation

### Recruitment
- POST /api/recruitment/jobs - Create job posting
- GET /api/recruitment/jobs - Get all job postings
- POST /api/recruitment/applications - Submit application
- GET /api/recruitment/applications/:jobId - Get applications for job

## Default Users

After initial setup, default users will be created:

- **Admin**: admin@hrms.com / admin123
- **HR**: hr@hrms.com / hr123
- **Manager**: manager@hrms.com / manager123
- **Employee**: employee@hrms.com / employee123

## License

ISC

## Support

For support, email support@hrms.com
