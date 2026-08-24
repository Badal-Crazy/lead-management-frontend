import React, { useEffect, useState } from 'react';
import Layout from '../Layout/Layout';
import { adminApi, userApi } from '../../api';

const AgentApproval = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    setLoading(true);
    setMessage('');
    try {
      // Use the admin API to get pending users
      const response = await adminApi.getPendingUsers();
      setPendingUsers(response.data || []);
    } catch (err) {
      console.error('Failed to fetch pending users:', err);
      setMessage('Failed to fetch pending users. Please try again.');
      setMessageType('danger');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (username, action) => {
    setProcessingId(username);
    setMessage('');
    
    try {
      if (action === 'approve') {
        await adminApi.approveUser(username);
        setMessage(`User ${username} approved successfully!`);
        setMessageType('success');
      } else {
        await adminApi.rejectUser(username);
        setMessage(`User ${username} rejected successfully!`);
        setMessageType('success');
      }
      
      // Refresh the list
      setTimeout(() => {
        fetchPendingUsers();
      }, 1000);
      
    } catch (err) {
      console.error('Failed to process approval:', err);
      setMessage(err.response?.data?.error || 'Failed to process approval. Please try again.');
      setMessageType('danger');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">Agent Approvals</h4>
          <p className="text-muted">Approve or reject pending agent registrations</p>
        </div>
        <button 
          className="btn btn-outline-secondary btn-sm"
          onClick={fetchPendingUsers}
          disabled={loading}
        >
          <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
        </button>
      </div>

      {message && (
        <div className={`alert alert-${messageType} alert-dismissible fade show`}>
          <i className={`fas fa-${messageType === 'success' ? 'check-circle' : 'exclamation-circle'} me-2`}></i>
          {message}
          <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
        </div>
      )}

      <div className="card card-glass p-4">
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary"></div>
            <p className="mt-3 text-muted">Loading pending users...</p>
          </div>
        ) : pendingUsers.length > 0 ? (
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Registered On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map(user => (
                  <tr key={user.username}>
                    <td><strong>{user.username}</strong></td>
                    <td>{user.email || 'N/A'}</td>
                    <td>{user.phone || 'N/A'}</td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      <button 
                        className="btn btn-success btn-sm me-2"
                        onClick={() => handleApproval(user.username, 'approve')}
                        disabled={processingId === user.username}
                      >
                        {processingId === user.username ? (
                          <span className="spinner-border spinner-border-sm"></span>
                        ) : (
                          <><i className="fas fa-check me-1"></i> Approve</>
                        )}
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleApproval(user.username, 'reject')}
                        disabled={processingId === user.username}
                      >
                        {processingId === user.username ? (
                          <span className="spinner-border spinner-border-sm"></span>
                        ) : (
                          <><i className="fas fa-times me-1"></i> Reject</>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-4">
            <i className="fas fa-check-circle text-success" style={{ fontSize: '48px' }}></i>
            <p className="mt-3 text-muted">No pending approvals</p>
            <p className="text-muted small">All users have been approved</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AgentApproval;
