import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../Layout/Layout';
import { dashboardApi, userApi, leadApi, dispositionApi } from '../../api';
import { useAuth } from '../../context/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    totalAgents: 0,
    activeAgents: 0,
    inactiveAgents: 0,
    totalDispositions: 0,
    todayDispositions: 0,
    totalCollection: 0,
    todayCollection: 0,
    upcomingPTP: [],
    agentWiseData: []
  });
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalLeads: 0,
    pendingLeads: 0,
    disposedLeads: 0,
    totalAgents: 0,
    totalDispositions: 0,
    totalAdmins: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredAgent, setHoveredAgent] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch admin dashboard data
      const adminRes = await dashboardApi.getAdminDashboard();
      
      // Fetch stats
      const statsRes = await dashboardApi.getStats();
      
      // Fetch recent activity
      const activityRes = await dashboardApi.getRecentActivity();
      
      // Fetch dispositions
      const dispositionsRes = await dispositionApi.getAllDispositions();

      // Update dashboard data from admin endpoint
      if (adminRes?.data) {
        setDashboardData({
          totalAgents: adminRes.data.totalAgents || 0,
          activeAgents: adminRes.data.activeAgents || 0,
          inactiveAgents: adminRes.data.inactiveAgents || 0,
          totalDispositions: adminRes.data.totalDispositions || 0,
          todayDispositions: adminRes.data.todayDispositions || 0,
          totalCollection: adminRes.data.totalCollection || 0,
          todayCollection: adminRes.data.todayCollection || 0,
          upcomingPTP: adminRes.data.upcomingPTP || [],
          agentWiseData: adminRes.data.agentWiseData || []
        });
      }

      // Update stats from stats endpoint
      if (statsRes?.data) {
        setStats({
          totalUsers: statsRes.data.totalUsers || 0,
          totalLeads: statsRes.data.totalLeads || 0,
          pendingLeads: statsRes.data.pendingLeads || 0,
          disposedLeads: statsRes.data.disposedLeads || 0,
          totalAgents: statsRes.data.totalAgents || 0,
          totalDispositions: statsRes.data.totalDispositions || 0,
          totalAdmins: statsRes.data.totalAdmins || 0
        });
      }

      // Update recent activity
      if (activityRes?.data) {
        setRecentActivity(activityRes.data);
      }

      console.log('Admin Dashboard Data:', adminRes?.data);
      console.log('Stats:', statsRes?.data);
      console.log('Activity:', activityRes?.data);
      console.log('Dispositions:', dispositionsRes?.data);

    } catch (err) {
      console.error('Failed to fetch admin dashboard data:', err);
      setError(err.response?.data?.error || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    { 
      title: 'Total Agents', 
      value: stats.totalAgents || dashboardData.totalAgents, 
      icon: 'fa-users', 
      color: '#667eea',
      subStats: [
        { label: 'Active', value: dashboardData.activeAgents, color: '#43e97b' },
        { label: 'Inactive', value: dashboardData.inactiveAgents, color: '#fa709a' }
      ]
    },
    { 
      title: 'Total Leads', 
      value: stats.totalLeads, 
      icon: 'fa-file-alt', 
      color: '#4facfe' 
    },
    { 
      title: 'Pending Leads', 
      value: stats.pendingLeads, 
      icon: 'fa-clock', 
      color: '#fa709a' 
    },
    { 
      title: 'Disposed Leads', 
      value: stats.disposedLeads, 
      icon: 'fa-check-circle', 
      color: '#43e97b' 
    },
    { 
      title: 'Total Dispositions', 
      value: stats.totalDispositions || dashboardData.totalDispositions, 
      icon: 'fa-trash-alt', 
      color: '#f6d365' 
    },
    { 
      title: "Today's Dispositions", 
      value: dashboardData.todayDispositions, 
      icon: 'fa-calendar-day', 
      color: '#4facfe' 
    },
    { 
      title: 'Total Collection', 
      value: `₹${(dashboardData.totalCollection || 0).toLocaleString()}`, 
      icon: 'fa-money-bill-wave', 
      color: '#43e97b' 
    },
    { 
      title: "Today's Collection", 
      value: `₹${(dashboardData.todayCollection || 0).toLocaleString()}`, 
      icon: 'fa-calendar-check', 
      color: '#f6d365' 
    },
  ];

  const handleRetry = () => {
    fetchDashboardData();
  };

  if (error) {
    return (
      <Layout>
        <div className="alert alert-danger m-4">
          <h5><i className="fas fa-exclamation-circle me-2"></i>Error Loading Dashboard</h5>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={handleRetry}>
            <i className="fas fa-sync me-2"></i>Retry
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <style>
        {`
          .stats-card {
            padding: 20px;
            border-radius: 12px;
            border: none;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            height: 100%;
          }
          .stats-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.12);
          }
          .stats-card .icon {
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 12px;
            font-size: 20px;
          }
          .card-glass {
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.06);
          }
          .table-hover tbody tr {
            transition: background-color 0.2s ease;
            cursor: pointer;
          }
          .table-hover tbody tr:hover {
            background-color: rgba(102, 126, 234, 0.05);
          }
          .badge {
            padding: 6px 12px;
            font-weight: 500;
            border-radius: 6px;
          }
          .list-group-item {
            background: transparent;
            padding: 12px 0;
            border: none;
          }
          .list-group-item:not(:last-child) {
            border-bottom: 1px solid rgba(0, 0, 0, 0.06) !important;
          }
          @keyframes pulse {
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
          }
          .col-md-2-4 {
            flex: 0 0 20%;
            max-width: 20%;
          }
          @media (max-width: 768px) {
            .col-md-2-4 {
              flex: 0 0 50%;
              max-width: 50%;
            }
          }
          @media (max-width: 576px) {
            .col-md-2-4 {
              flex: 0 0 100%;
              max-width: 100%;
            }
          }
          .hover-details {
            font-size: 12px;
            color: #6c757d;
          }
          .agent-row-selected {
            background-color: rgba(102, 126, 234, 0.1) !important;
          }
          .activity-item {
            padding: 12px 0;
            border-bottom: 1px solid rgba(0, 0, 0, 0.06);
          }
          .activity-item:last-child {
            border-bottom: none;
          }
          .activity-icon {
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background: rgba(102, 126, 234, 0.1);
            color: #667eea;
          }
        `}
      </style>

      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap">
        <div>
          <h4 className="mb-1">Admin Dashboard</h4>
          <p className="text-muted">Welcome back, {user?.username || 'Admin'}!</p>
        </div>
        <div className="mt-2 mt-sm-0">
          <span className="badge bg-primary me-2">
            <i className="fas fa-shield-alt me-1"></i>
            Admin
          </span>
          <span className="text-muted">{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-4 mb-4">
        {statsCards.map((stat, index) => (
          <div className="col-md-2-4 col-sm-6" key={index}>
            <div className="card stats-card">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">{stat.title}</h6>
                  <h3 className="mb-0 fw-bold">{loading ? '...' : stat.value}</h3>
                  {stat.subStats && (
                    <div className="mt-2">
                      {stat.subStats.map((sub, idx) => (
                        <span key={idx} className="me-2" style={{ fontSize: '12px' }}>
                          <span className="badge" style={{ background: sub.color }}>
                            {sub.label}: {loading ? '...' : sub.value}
                          </span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="icon" style={{ background: `${stat.color}20`, color: stat.color }}>
                  <i className={`fas ${stat.icon}`}></i>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row">
        {/* Agent Wise Details */}
        <div className="col-md-8 mb-4">
          <div className="card card-glass p-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0">Agent Wise Performance</h6>
              <button 
                className="btn btn-sm btn-outline-primary"
                onClick={() => navigate('/agents')}
              >
                View All <i className="fas fa-arrow-right ms-1"></i>
              </button>
            </div>
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary"></div>
              </div>
            ) : dashboardData.agentWiseData?.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Agent Name</th>
                      <th>Leads</th>
                      <th>Dispositions</th>
                      <th>PTP</th>
                      <th>Collection</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.agentWiseData.map((agent) => (
                      <tr 
                        key={agent.id}
                        className={selectedAgent === agent.id ? 'agent-row-selected' : ''}
                        onMouseEnter={() => setHoveredAgent(agent.id)}
                        onMouseLeave={() => setHoveredAgent(null)}
                        onClick={() => setSelectedAgent(agent.id === selectedAgent ? null : agent.id)}
                      >
                        <td>
                          <div className="fw-bold">{agent.name}</div>
                          {hoveredAgent === agent.id && (
                            <div className="hover-details">{agent.email}</div>
                          )}
                        </td>
                        <td>{agent.totalLeads}</td>
                        <td>{agent.dispositions}</td>
                        <td>{agent.ptp}</td>
                        <td>₹{(agent.collection || 0).toLocaleString()}</td>
                        <td>
                          <span className={`badge bg-${agent.isActive ? 'success' : 'danger'}`}>
                            {agent.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted text-center py-4">No agent data available</p>
            )}
          </div>
        </div>

        {/* Recent Activity & Upcoming PTP */}
        <div className="col-md-4 mb-4">
          {/* Recent Activity */}
          <div className="card card-glass p-3 mb-4">
            <h6 className="mb-3">Recent Activity</h6>
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary"></div>
              </div>
            ) : recentActivity.length > 0 ? (
              <div>
                {recentActivity.map((activity, index) => (
                  <div key={index} className="activity-item d-flex align-items-center">
                    <div className="activity-icon me-3">
                      <i className={`fas ${activity.icon || 'fa-bell'}`}></i>
                    </div>
                    <div className="flex-grow-1">
                      <div className="fw-bold">{activity.message}</div>
                      <div className="text-muted small">{activity.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted text-center py-4">No recent activity</p>
            )}
          </div>

          {/* Upcoming PTP/Stocks */}
          <div className="card card-glass p-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0">Upcoming PTP / Stocks</h6>
              <button 
                className="btn btn-sm btn-outline-primary"
                onClick={() => navigate('/ptp')}
              >
                View All <i className="fas fa-arrow-right ms-1"></i>
              </button>
            </div>
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary"></div>
              </div>
            ) : dashboardData.upcomingPTP?.length > 0 ? (
              <div className="list-group list-group-flush">
                {dashboardData.upcomingPTP.map((item, index) => (
                  <div key={index} className="list-group-item">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="fw-bold">{item.customerName}</div>
                        <div className="text-muted small">{item.phoneNumber}</div>
                      </div>
                      <div className="text-end">
                        <div className="fw-bold text-success">₹{(item.amount || 0).toLocaleString()}</div>
                        <div className="text-muted small">{item.date}</div>
                      </div>
                    </div>
                    {item.notes && (
                      <div className="text-muted small mt-1">{item.notes}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted text-center py-4">No upcoming PTP scheduled</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row">
        <div className="col-12">
          <div className="card card-glass p-3">
            <h6 className="mb-3">Admin Actions</h6>
            <div className="d-flex gap-2 flex-wrap">
              <button className="btn btn-primary" onClick={() => navigate('/agents')}>
                <i className="fas fa-user-plus me-2"></i>Manage Agents
              </button>
              <button className="btn btn-success" onClick={() => navigate('/reports')}>
                <i className="fas fa-chart-bar me-2"></i>View Reports
              </button>
              <button className="btn btn-info text-white" onClick={() => navigate('/leads')}>
                <i className="fas fa-users me-2"></i>All Leads
              </button>
              <button className="btn btn-warning" onClick={() => navigate('/dispositions')}>
                <i className="fas fa-check-circle me-2"></i>Dispositions
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;