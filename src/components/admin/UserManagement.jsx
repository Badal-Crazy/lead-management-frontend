import React, { useEffect, useState } from 'react';
import Layout from '../Layout/Layout';
import { adminApi } from '../../api';
import { useAuth } from '../../context/AuthContext';

const UserManagement = () => {
  const { user, isSuperAdmin, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await adminApi.getAllUsers();
      setUsers(response.data || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setMessage('Failed to fetch users. Please try again.');
      setMessageType('danger');
    } finally {
      setLoading(false);
    }
  };

  const canDeleteUser = (targetUser) => {
    // Super Admin can delete anyone except themselves
    if (isSuperAdmin()) {
      return targetUser.username !== 'superadmin';
    }
    // Admin can only delete agents
    if (isAdmin() && !isSuperAdmin()) {
      return targetUser.role === 'ROLE_AGENT' && targetUser.username !== 'admin';
    }
    return false;
  };

  const getDeleteTooltip = (targetUser) => {
    if (isSuperAdmin() && targetUser.username === 'superadmin') {
      return 'Cannot delete Super Admin';
    }
    if (isAdmin() && !isSuperAdmin() && targetUser.role !== 'ROLE_AGENT') {
      return 'Admins can only delete agents';
    }
    if (isAdmin() && !isSuperAdmin() && targetUser.username === 'admin') {
      return 'Cannot delete self';
    }
    return 'Delete user';
  };

  const handleDeleteUser = async (username) => {
    if (!window.confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(username);
    setMessage('');

    try {
      await adminApi.deleteUser(username);
      setMessage(`User "${username}" deleted successfully!`);
      setMessageType('success');
      
      setTimeout(() => {
        fetchUsers();
      }, 1000);
      
    } catch (err) {
      console.error('Failed to delete user:', err);
      setMessage(err.response?.data?.error || 'Failed to delete user. Please try again.');
      setMessageType('danger');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleUser = async (username, enabled) => {
    try {
      await adminApi.toggleUser(username, !enabled);
      setMessage(`User "${username}" ${!enabled ? 'activated' : 'deactivated'} successfully!`);
      setMessageType('success');
      fetchUsers();
    } catch (err) {
      console.error('Failed to toggle user:', err);
      setMessage('Failed to toggle user. Please try again.');
      setMessageType('danger');
    }
  };

  const handleUpdateRole = async (username, role) => {
    try {
      await adminApi.updateUserRole(username, role);
      setMessage(`User "${username}" role updated to ${role}!`);
      setMessageType('success');
      fetchUsers();
    } catch (err) {
      console.error('Failed to update role:', err);
      setMessage('Failed to update role. Please try again.');
      setMessageType('danger');
    }
  };

  const handleChangePassword = async (username) => {
    const newPassword = prompt(`Enter new password for ${username}:`);
    if (newPassword && newPassword.length >= 6) {
      try {
        await adminApi.changePassword(username, newPassword);
        setMessage(`Password changed for ${username}`);
        setMessageType('success');
      } catch (err) {
        setMessage('Failed to change password');
        setMessageType('danger');
      }
    } else if (newPassword) {
      setMessage('Password must be at least 6 characters', 'danger');
    }
  };

  const getRoleBadge = (role) => {
    const roleMap = {
      'ROLE_SUPER_ADMIN': 'danger',
      'ROLE_ADMIN': 'warning',
      'ROLE_AGENT': 'info'
    };
    const color = roleMap[role] || 'secondary';
    return <span className={`badge bg-${color}`}>{role?.replace('ROLE_', '') || 'AGENT'}</span>;
  };

  const isDeletable = (targetUser) => {
    return canDeleteUser(targetUser);
  };

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">User Management</h4>
          <p className="text-muted">
            {isSuperAdmin() ? 'Full access - Manage all users' : 'Manage agents'}
          </p>
        </div>
        <button 
          className="btn btn-outline-secondary btn-sm"
          onClick={fetchUsers}
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
            <p className="mt-3 text-muted">Loading users...</p>
          </div>
        ) : users.length > 0 ? (
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.username}>
                    <td><strong>{user.username}</strong></td>
                    <td>{user.email || 'N/A'}</td>
                    <td>{user.phone || 'N/A'}</td>
                    <td>
                      {isSuperAdmin() ? (
                        <select
                          className="form-select form-select-sm"
                          value={user.role || 'ROLE_AGENT'}
                          onChange={(e) => handleUpdateRole(user.username, e.target.value)}
                          style={{ width: '120px' }}
                          disabled={user.username === 'superadmin'}
                        >
                          <option value="ROLE_AGENT">Agent</option>
                          <option value="ROLE_ADMIN">Admin</option>
                          <option value="ROLE_SUPER_ADMIN">Super Admin</option>
                        </select>
                      ) : (
                        getRoleBadge(user.role)
                      )}
                    </td>
                    <td>
                      <span className={`badge bg-${user.enabled ? 'success' : 'danger'}`}>
                        {user.enabled ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`btn btn-sm ${user.enabled ? 'btn-warning' : 'btn-success'} me-1`}
                        onClick={() => handleToggleUser(user.username, user.enabled)}
                        title={user.enabled ? 'Deactivate' : 'Activate'}
                      >
                        <i className={`fas fa-${user.enabled ? 'pause' : 'play'}`}></i>
                      </button>
                      <button
                        className="btn btn-sm btn-info me-1"
                        onClick={() => handleChangePassword(user.username)}
                        title="Change Password"
                      >
                        <i className="fas fa-key"></i>
                      </button>
                      {isDeletable(user) && (
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteUser(user.username)}
                          disabled={deletingId === user.username}
                          title={getDeleteTooltip(user)}
                        >
                          {deletingId === user.username ? (
                            <span className="spinner-border spinner-border-sm"></span>
                          ) : (
                            <i className="fas fa-trash"></i>
                          )}
                        </button>
                      )}
                      {!isDeletable(user) && user.username !== 'superadmin' && user.username !== 'admin' && (
                        <button
                          className="btn btn-sm btn-secondary"
                          disabled
                          title={getDeleteTooltip(user)}
                        >
                          <i className="fas fa-lock"></i>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-4">
            <i className="fas fa-users" style={{ fontSize: '48px', color: '#ccc' }}></i>
            <p className="text-muted mt-3">No users found</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default UserManagement;
