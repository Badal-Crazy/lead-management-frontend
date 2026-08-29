import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../Layout/Layout';
import { dashboardApi, leadApi, dispositionApi } from '../../api';
import { useAuth } from '../../context/AuthContext';

const AgentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    totalLeads: 0,
    totalDispositions: 0,
    totalPTP: 0,
    totalCollection: 0,
    todayPTP: 0,
    todayCollection: 0,
    todayPTPLeads: [],
    todayCollectionLeads: []
  });
  const [recentLeads, setRecentLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredLead, setHoveredLead] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashboardRes, leadsRes] = await Promise.all([
        dashboardApi.getAgentDashboard(),
        leadApi.getMyAllocation()
      ]);
      
      if (dashboardRes?.data) {
        setDashboardData(dashboardRes.data);
      }
      
      if (leadsRes?.data) {
        setRecentLeads(leadsRes.data.slice(0, 5));
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to fetch dashboard data');
      // Initialize with empty data
      setDashboardData({
        totalLeads: 0,
        totalDispositions: 0,
        totalPTP: 0,
        totalCollection: 0,
        todayPTP: 0,
        todayCollection: 0,
        todayPTPLeads: [],
        todayCollectionLeads: []
      });
      setRecentLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    { title: 'Total Leads', value: dashboardData.totalLeads, icon: 'fa-users', color: '#667eea' },
    { title: 'Total Dispositions', value: dashboardData.totalDispositions, icon: 'fa-check-circle', color: '#43e97b' },
    { title: 'Total PTP', value: dashboardData.totalPTP, icon: 'fa-phone', color: '#f6d365' },
    { title: 'Total Collection', value: `₹${dashboardData.totalCollection?.toLocaleString() || 0}`, icon: 'fa-money-bill-wave', color: '#4facfe' },
  ];

  const handleLeadAction = (leadId, action) => {
    if (action === 'profile') {
      navigate(`/lead/${leadId}`);
    } else if (action === 'add') {
      navigate(`/lead/${leadId}/payment`);
    }
  };

  if (error) {
    return (
      <Layout>
        <div className="alert alert-danger m-4">
          <h5><i className="fas fa-exclamation-circle me-2"></i>Error Loading Dashboard</h5>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchDashboardData}>
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
          }
          .table-hover tbody tr:hover {
            background-color: rgba(102, 126, 234, 0.05);
          }
          .badge {
            padding: 6px 12px;
            font-weight: 500;
            border-radius: 6px;
          }
          @keyframes pulse {
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
          }
          .hover-details {
            font-size: 12px;
            color: #6c757d;
          }
          .btn-action {
            padding: 4px 8px;
            font-size: 12px;
          }
          .lead-table-container {
            max-height: 300px;
            overflow-y: auto;
          }
          .lead-table-container::-webkit-scrollbar {
            width: 6px;
          }
          .lead-table-container::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 3px;
          }
          .lead-table-container::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 3px;
          }
          .lead-table-container::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
        `}
      </style>

      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap">
        <div>
          <h4 className="mb-1">Agent Dashboard</h4>
          <p className="text-muted">Welcome back, {user?.username || 'Agent'}!</p>
        </div>
        <div className="mt-2 mt-sm-0">
          <span className="badge bg-success me-2">
            <i className="fas fa-circle me-1" style={{ fontSize: '8px' }}></i>
            Online
          </span>
          <span className="text-muted">{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-4 mb-4">
        {statsCards.map((stat, index) => (
          <div className="col-md-3 col-sm-6" key={index}>
            <div className="card stats-card">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">{stat.title}</h6>
                  <h3 className="mb-0 fw-bold">{loading ? '...' : stat.value}</h3>
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
        {/* Today's PTP Section */}
        <div className="col-lg-6 mb-4">
          <div className="card card-glass p-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0">Today's PTP ({dashboardData.todayPTP})</h6>
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
            ) : dashboardData.todayPTPLeads?.length > 0 ? (
              <div className="table-responsive lead-table-container">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Phone</th>
                      <th>Amount</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.todayPTPLeads.map((lead) => (
                      <tr 
                        key={lead.id}
                        onMouseEnter={() => setHoveredLead(lead.id)}
                        onMouseLeave={() => setHoveredLead(null)}
                      >
                        <td>
                          <div>
                            <div className="fw-bold">{lead.name}</div>
                            {hoveredLead === lead.id && (
                              <div className="hover-details">{lead.customerDetails}</div>
                            )}
                          </div>
                        </td>
                        <td>{lead.phoneNumber}</td>
                        <td>₹{lead.amount?.toLocaleString() || 'N/A'}</td>
                        <td>
                          <button 
                            className="btn btn-sm btn-outline-success me-1 btn-action"
                            onClick={() => handleLeadAction(lead.id, 'add')}
                            title="Add Payment"
                          >
                            <i className="fas fa-plus"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-primary btn-action"
                            onClick={() => handleLeadAction(lead.id, 'profile')}
                            title="View Profile"
                          >
                            <i className="fas fa-user"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted text-center py-4">No PTP scheduled for today</p>
            )}
          </div>
        </div>

        {/* Today's Collection Section */}
        <div className="col-lg-6 mb-4">
          <div className="card card-glass p-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0">Today's Collection (₹{dashboardData.todayCollection?.toLocaleString() || 0})</h6>
              <button 
                className="btn btn-sm btn-outline-primary"
                onClick={() => navigate('/collections')}
              >
                View All <i className="fas fa-arrow-right ms-1"></i>
              </button>
            </div>
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary"></div>
              </div>
            ) : dashboardData.todayCollectionLeads?.length > 0 ? (
              <div className="table-responsive lead-table-container">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Phone</th>
                      <th>Amount</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.todayCollectionLeads.map((lead) => (
                      <tr 
                        key={lead.id}
                        onMouseEnter={() => setHoveredLead(lead.id)}
                        onMouseLeave={() => setHoveredLead(null)}
                      >
                        <td>
                          <div>
                            <div className="fw-bold">{lead.name}</div>
                            {hoveredLead === lead.id && (
                              <div className="hover-details">{lead.customerDetails}</div>
                            )}
                          </div>
                        </td>
                        <td>{lead.phoneNumber}</td>
                        <td>₹{lead.amount?.toLocaleString() || 'N/A'}</td>
                        <td>
                          <button 
                            className="btn btn-sm btn-outline-success me-1 btn-action"
                            onClick={() => handleLeadAction(lead.id, 'add')}
                            title="Add Payment"
                          >
                            <i className="fas fa-plus"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-primary btn-action"
                            onClick={() => handleLeadAction(lead.id, 'profile')}
                            title="View Profile"
                          >
                            <i className="fas fa-user"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted text-center py-4">No collections recorded today</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Leads and Quick Actions */}
      <div className="row">
        <div className="col-lg-8 mb-4">
          <div className="card card-glass p-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0">Recent Allocated Leads</h6>
              <button 
                className="btn btn-sm btn-outline-primary"
                onClick={() => navigate('/my-leads')}
              >
                View All <i className="fas fa-arrow-right ms-1"></i>
              </button>
            </div>
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary"></div>
              </div>
            ) : recentLeads.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Lender</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLeads.map((lead) => (
                      <tr key={lead.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/lead/${lead.id}`)}>
                        <td>{lead.name}</td>
                        <td>{lead.phoneNumber}</td>
                        <td>{lead.lenderProcessName || 'N/A'}</td>
                        <td>
                          <span className={`badge bg-${lead.status === 'Pending' ? 'warning' : lead.status === 'Completed' ? 'success' : 'secondary'}`}>
                            {lead.status || 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted text-center py-4">No leads allocated yet</p>
            )}
          </div>
        </div>

        <div className="col-lg-4 mb-4">
          <div className="card card-glass p-3">
            <h6 className="mb-3">Quick Actions</h6>
            <div className="d-grid gap-2">
              <button className="btn btn-primary" onClick={() => navigate('/search')}>
                <i className="fas fa-search me-2"></i>Search Leads
              </button>
              <button className="btn btn-success" onClick={() => navigate('/dispose')}>
                <i className="fas fa-trash-alt me-2"></i>Dispose Lead
              </button>
              <button className="btn btn-info text-white" onClick={() => navigate('/profile')}>
                <i className="fas fa-user me-2"></i>My Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AgentDashboard;