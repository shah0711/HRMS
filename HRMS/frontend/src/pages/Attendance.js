import React, { useState, useEffect } from 'react';
import { attendanceAPI } from '../services/api';

function Attendance({ user }) {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      if (user.employee?._id) {
        const response = await attendanceAPI.getByUser(user.employee._id);
        setAttendance(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="main-content container">Loading...</div>;

  return (
    <div className="main-content">
      <div className="container">
        <h1>My Attendance</h1>
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Work Hours</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map(att => (
                <tr key={att._id}>
                  <td>{new Date(att.date).toLocaleDateString()}</td>
                  <td>{new Date(att.checkIn.time).toLocaleTimeString()}</td>
                  <td>{att.checkOut?.time ? new Date(att.checkOut.time).toLocaleTimeString() : '-'}</td>
                  <td>{att.workHours} hrs</td>
                  <td>
                    <span className={`status-badge status-${att.status.toLowerCase().replace(' ', '-')}`}>
                      {att.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {attendance.length === 0 && (
            <p style={{ textAlign: 'center', padding: '20px' }}>No attendance records found.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Attendance;
