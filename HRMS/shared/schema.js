const { pgTable, serial, varchar, text, integer, boolean, timestamp, date, numeric, json } = require('drizzle-orm/pg-core');

const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).default('employee'),
  employeeId: integer('employee_id'),
  isActive: boolean('is_active').default(true),
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('created_at').defaultNow()
});

const employees = pgTable('employees', {
  id: serial('id').primaryKey(),
  employeeCode: varchar('employee_code', { length: 50 }).notNull().unique(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 20 }).notNull(),
  dateOfBirth: date('date_of_birth').notNull(),
  gender: varchar('gender', { length: 10 }).notNull(),
  address: json('address'),
  department: varchar('department', { length: 50 }).notNull(),
  position: varchar('position', { length: 100 }).notNull(),
  joiningDate: date('joining_date').notNull(),
  employmentType: varchar('employment_type', { length: 20 }).default('Full-time'),
  basicSalary: numeric('basic_salary', { precision: 12, scale: 2 }).notNull(),
  allowances: json('allowances').default({}),
  deductions: json('deductions').default({}),
  managerId: integer('manager_id'),
  emergencyContact: json('emergency_contact'),
  status: varchar('status', { length: 20 }).default('Active'),
  profileImage: text('profile_image'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

const attendance = pgTable('attendance', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').notNull(),
  date: date('date').notNull(),
  checkInTime: timestamp('check_in_time'),
  checkInLocation: varchar('check_in_location', { length: 255 }),
  checkInNotes: text('check_in_notes'),
  checkOutTime: timestamp('check_out_time'),
  checkOutLocation: varchar('check_out_location', { length: 255 }),
  checkOutNotes: text('check_out_notes'),
  status: varchar('status', { length: 20 }).default('Present'),
  workHours: numeric('work_hours', { precision: 5, scale: 2 }).default('0'),
  isLate: boolean('is_late').default(false),
  lateBy: integer('late_by').default(0),
  earlyLeave: boolean('early_leave').default(false),
  earlyLeaveBy: integer('early_leave_by').default(0),
  overtime: integer('overtime').default(0),
  remarks: text('remarks'),
  createdAt: timestamp('created_at').defaultNow()
});

const leaves = pgTable('leaves', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').notNull(),
  leaveType: varchar('leave_type', { length: 50 }).notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  numberOfDays: integer('number_of_days').notNull(),
  reason: text('reason').notNull(),
  status: varchar('status', { length: 20 }).default('Pending'),
  appliedDate: timestamp('applied_date').defaultNow(),
  approvedById: integer('approved_by_id'),
  approvedDate: timestamp('approved_date'),
  rejectionReason: text('rejection_reason'),
  documents: json('documents').default([]),
  comments: json('comments').default([]),
  createdAt: timestamp('created_at').defaultNow()
});

const payrolls = pgTable('payrolls', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').notNull(),
  month: integer('month').notNull(),
  year: integer('year').notNull(),
  basicSalary: numeric('basic_salary', { precision: 12, scale: 2 }).notNull(),
  allowances: json('allowances').default({}),
  deductions: json('deductions').default({}),
  workingDays: integer('working_days').notNull(),
  presentDays: integer('present_days').notNull(),
  absentDays: integer('absent_days').default(0),
  leaveDays: integer('leave_days').default(0),
  overtimeHours: numeric('overtime_hours', { precision: 5, scale: 2 }).default('0'),
  overtimePay: numeric('overtime_pay', { precision: 12, scale: 2 }).default('0'),
  grossSalary: numeric('gross_salary', { precision: 12, scale: 2 }).notNull(),
  totalDeductions: numeric('total_deductions', { precision: 12, scale: 2 }).notNull(),
  netSalary: numeric('net_salary', { precision: 12, scale: 2 }).notNull(),
  status: varchar('status', { length: 20 }).default('Draft'),
  paymentDate: timestamp('payment_date'),
  paymentMethod: varchar('payment_method', { length: 20 }),
  remarks: text('remarks'),
  generatedById: integer('generated_by_id'),
  generatedAt: timestamp('generated_at').defaultNow()
});

const performances = pgTable('performances', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').notNull(),
  reviewStartDate: date('review_start_date').notNull(),
  reviewEndDate: date('review_end_date').notNull(),
  reviewType: varchar('review_type', { length: 20 }).notNull(),
  reviewerId: integer('reviewer_id').notNull(),
  criteria: json('criteria').default([]),
  goals: json('goals').default([]),
  overallRating: numeric('overall_rating', { precision: 3, scale: 1 }),
  strengths: json('strengths').default([]),
  areasOfImprovement: json('areas_of_improvement').default([]),
  trainingRecommendations: json('training_recommendations').default([]),
  employeeComments: text('employee_comments'),
  reviewerComments: text('reviewer_comments'),
  managerComments: text('manager_comments'),
  status: varchar('status', { length: 20 }).default('Draft'),
  nextReviewDate: date('next_review_date'),
  acknowledged: boolean('acknowledged').default(false),
  acknowledgedDate: timestamp('acknowledged_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

const recruitments = pgTable('recruitments', {
  id: serial('id').primaryKey(),
  jobTitle: varchar('job_title', { length: 200 }).notNull(),
  department: varchar('department', { length: 50 }).notNull(),
  position: varchar('position', { length: 100 }).notNull(),
  jobDescription: text('job_description').notNull(),
  requirements: json('requirements').default({}),
  numberOfOpenings: integer('number_of_openings').default(1),
  employmentType: varchar('employment_type', { length: 20 }).default('Full-time'),
  salaryRange: json('salary_range').default({}),
  location: varchar('location', { length: 200 }).notNull(),
  postedById: integer('posted_by_id').notNull(),
  postedDate: timestamp('posted_date').defaultNow(),
  applicationDeadline: date('application_deadline').notNull(),
  status: varchar('status', { length: 20 }).default('Open'),
  applications: json('applications').default([]),
  hiringManagerId: integer('hiring_manager_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

module.exports = {
  users,
  employees,
  attendance,
  leaves,
  payrolls,
  performances,
  recruitments
};
