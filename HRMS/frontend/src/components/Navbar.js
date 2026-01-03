import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

function Navbar({ user, onLogout }) {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/dashboard">HRMS</Link>
        </div>
        <ul className="navbar-menu">
          <li><Link to="/dashboard">Dashboard</Link></li>
          {(user.role === 'admin' || user.role === 'hr') && (
            <li><Link to="/employees">Employees</Link></li>
          )}
          <li><Link to="/attendance">Attendance</Link></li>
          <li><Link to="/leaves">Leaves</Link></li>
          {(user.role === 'admin' || user.role === 'hr') && (
            <li><Link to="/payroll">Payroll</Link></li>
          )}
          <li><Link to="/performance">Performance</Link></li>
          {(user.role === 'admin' || user.role === 'hr') && (
            <li><Link to="/recruitment">Recruitment</Link></li>
          )}
        </ul>
        <div className="navbar-user">
          <span className="user-info">
            {user.employee?.firstName} {user.employee?.lastName} ({user.role})
          </span>
          <button onClick={onLogout} className="btn btn-logout">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
