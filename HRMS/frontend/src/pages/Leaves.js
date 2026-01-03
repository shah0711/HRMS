import React, { useState, useEffect } from 'react';
import { leaveAPI } from '../services/api';

function Leaves({ user }) {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      if (user.employee?._id) {
        const response = await leaveAPI.getByUser(user.employee._id);
        setLeaves(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="main-content container">Loading...</div>;

  return (
    <div className="main-content">
      <div className="container">
        <h1>Leave Management</h1>
        
        <div className="card">
          <button 
            className="btn btn-primary" 
            onClick={() => setShowForm(!showForm)}
            style={{ marginBottom: '20px' }}
          >
            {showForm ? 'Cancel' : 'Apply for Leave'}
          </button>

          {showForm && (
            <div style={{ marginBottom: '20px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <h3>Leave Application Form</h3>
              <p>Leave application form will be implemented here.</p>
            </div>
          )}

          <table>
            <thead>
              <tr>
                <th>Leave Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Applied Date</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map(leave => (
                <tr key={leave._id}>
                  <td>{leave.leaveType}</td>
                  <td>{new Date(leave.startDate).toLocaleDateString()}</td>
                  <td>{new Date(leave.endDate).toLocaleDateString()}</td>
                  <td>{leave.numberOfDays}</td>
                  <td>{leave.reason}</td>
                  <td>
                    <span className={`status-badge status-${leave.status.toLowerCase()}`}>
                      {leave.status}
                    </span>
                  </td>
                  <td>{new Date(leave.appliedDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {leaves.length === 0 && (
            <p style={{ textAlign: 'center', padding: '20px' }}>No leave applications found.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Leaves;
