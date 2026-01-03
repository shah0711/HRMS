import React, { useState, useEffect } from 'react';
import { attendanceAPI } from '../services/api';
import './Dashboard.css';

function Dashboard({ user }) {
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    pendingLeaves: 0,
    upcomingReviews: 0
  });

  useEffect(() => {
    fetchTodayAttendance();
  }, []);

  const fetchTodayAttendance = async () => {
    try {
      const response = await attendanceAPI.getToday();
      setTodayAttendance(response.data.data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const handleCheckIn = async () => {
    try {
      await attendanceAPI.checkIn({ location: 'Office' });
      fetchTodayAttendance();
      alert('Checked in successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Error checking in');
    }
  };

  const handleCheckOut = async () => {
    try {
      await attendanceAPI.checkOut({ location: 'Office' });
      fetchTodayAttendance();
      alert('Checked out successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Error checking out');
    }
  };

  return (
    <div className="dashboard main-content">
      <div className="container">
        <h1>Dashboard</h1>
        
        <div className="welcome-section">
          <h2>Welcome back, {user.employee?.firstName}!</h2>
          <p>Today is {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>Quick Actions</h3>
            <div className="quick-actions">
              {!todayAttendance && (
                <button onClick={handleCheckIn} className="btn btn-success">
                  Check In
                </button>
              )}
              {todayAttendance && !todayAttendance.checkOut?.time && (
                <button onClick={handleCheckOut} className="btn btn-primary">
                  Check Out
                </button>
              )}
              {todayAttendance && todayAttendance.checkOut?.time && (
                <div className="attendance-complete">
                  ✓ Attendance marked for today
                </div>
              )}
            </div>
          </div>

          {todayAttendance && (
            <div className="dashboard-card">
              <h3>Today's Attendance</h3>
              <div className="attendance-info">
                <p><strong>Check In:</strong> {
                  new Date(todayAttendance.checkIn.time).toLocaleTimeString()
                }</p>
                {todayAttendance.checkOut?.time && (
                  <>
                    <p><strong>Check Out:</strong> {
                      new Date(todayAttendance.checkOut.time).toLocaleTimeString()
                    }</p>
                    <p><strong>Work Hours:</strong> {todayAttendance.workHours} hours</p>
                  </>
                )}
              </div>
            </div>
          )}

          {(user.role === 'admin' || user.role === 'hr') && (
            <>
              <div className="dashboard-card stats-card">
                <h3>Total Employees</h3>
                <div className="stat-number">{stats.totalEmployees}</div>
              </div>

              <div className="dashboard-card stats-card">
                <h3>Present Today</h3>
                <div className="stat-number">{stats.presentToday}</div>
              </div>

              <div className="dashboard-card stats-card">
                <h3>Pending Leaves</h3>
                <div className="stat-number">{stats.pendingLeaves}</div>
              </div>

              <div className="dashboard-card stats-card">
                <h3>Upcoming Reviews</h3>
                <div className="stat-number">{stats.upcomingReviews}</div>
              </div>
            </>
          )}
        </div>

        <div className="dashboard-card">
          <h3>Recent Activity</h3>
          <p>No recent activity to display.</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
