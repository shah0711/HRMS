import React, { useState, useEffect } from 'react';
import { employeeAPI } from '../services/api';

function Employees({ user }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await employeeAPI.getAll();
      setEmployees(response.data.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="main-content container">Loading...</div>;

  return (
    <div className="main-content">
      <div className="container">
        <h1>Employee Management</h1>
        <div className="card">
          <div style={{ marginBottom: '20px' }}>
            <button className="btn btn-primary">Add New Employee</button>
          </div>
          <table>
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Position</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp._id}>
                  <td>{emp.employeeId}</td>
                  <td>{emp.firstName} {emp.lastName}</td>
                  <td>{emp.email}</td>
                  <td>{emp.department}</td>
                  <td>{emp.position}</td>
                  <td>
                    <span className={`status-badge status-${emp.status.toLowerCase()}`}>
                      {emp.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-primary" style={{ marginRight: '5px' }}>
                      View
                    </button>
                    <button className="btn btn-primary">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {employees.length === 0 && (
            <p style={{ textAlign: 'center', padding: '20px' }}>No employees found.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Employees;
