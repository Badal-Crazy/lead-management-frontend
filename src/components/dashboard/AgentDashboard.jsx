// src/components/dashboard/AgentDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../Layout/Layout';
import { leadApi, dispositionApi } from '../../api';
import { useAuth } from '../../context/AuthContext';

const AgentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [allLeads, setAllLeads] = useState([]);
  const [dashboardData, setDashboardData] = useState({
    totalCollection: 0,
    totalUpcomingPTP: 0,
    totalUpcomingPTPAmount: 0,
    totalBPTP: 0,
    totalBPTPAmount: 0,
    todayTasks: [],
    upcomingPTPs: [],
    bptpData: [],
    recentActivities: [],
    totalLeads: 0,
    pendingLeads: 0,
    completedLeads: 0,
    disposedLeads: 0
  });
  const [showAllData, setShowAllData] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedMonth]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    setShowAllData(false);
    try {
      const month = selectedMonth.toISOString().slice(0, 7);
      console.log(`📊 Fetching agent dashboard data for ${month}...`);
      
      let leads = [];
      let response = null;
      
      // Try multiple approaches to get data
      try {
        console.log('🔄 Trying dispositionApi.getDispositions()...');
        response = await dispositionApi.getDispositions();
      } catch (err1) {
        console.log('❌ getDispositions failed:', err1.message);
        
        try {
          console.log('🔄 Trying dispositionApi.getAllDispositions()...');
          response = await dispositionApi.getAllDispositions();
        } catch (err2) {
          console.log('❌ getAllDispositions failed:', err2.message);
          
          try {
            console.log('🔄 Trying leadApi.getLeads()...');
            response = await leadApi.getLeads();
          } catch (err3) {
            console.log('❌ getLeads failed:', err3.message);
          }
        }
      }
      
      // If we got a response, extract leads/dispositions
      if (response?.data) {
        if (Array.isArray(response.data)) {
          leads = response.data;
        } else if (response.data.dispositions && Array.isArray(response.data.dispositions)) {
          leads = response.data.dispositions.map(d => ({
            id: d.id || `disp_${Math.random()}`,
            name: d.customerName || d.leadName || d.name || 'Unknown',
            phoneNumber: d.phoneNumber || d.phone || 'N/A',
            status: d.status || d.dispositionStatus || 'Pending',
            amount: d.amount || d.collectionAmount || 0,
            collectedAmount: d.collectedAmount || d.amountCollected || 0,
            ptpAmount: d.ptpAmount || d.promiseAmount || 0,
            ptpDate: d.ptpDate || d.promiseDate || d.nextFollowUp,
            ptpStatus: d.ptpStatus || d.promiseStatus || 'Pending',
            followUpDate: d.followUpDate || d.nextFollowUp || d.followupDate,
            createdAt: d.createdAt || d.createdDate || d.date || new Date().toISOString(),
            updatedAt: d.updatedAt || d.updatedDate || new Date().toISOString(),
            priority: d.priority || 'Medium',
            lenderProcessName: d.lenderProcessName || d.lender || 'N/A',
            allocationMonthYear: d.allocationMonthYear || d.month || new Date().toISOString().slice(0, 7)
          }));
        } else if (response.data.leads && Array.isArray(response.data.leads)) {
          leads = response.data.leads;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          leads = response.data.data;
        } else if (response.data.results && Array.isArray(response.data.results)) {
          leads = response.data.results;
        }
      }
      
      console.log(`📋 Total records fetched: ${leads.length}`);
      
      // If no leads, show empty state
      if (leads.length === 0) {
        setAllLeads([]);
        setDashboardData({
          totalCollection: 0,
          totalUpcomingPTP: 0,
          totalUpcomingPTPAmount: 0,
          totalBPTP: 0,
          totalBPTPAmount: 0,
          todayTasks: [],
          upcomingPTPs: [],
          bptpData: [],
          recentActivities: [],
          totalLeads: 0,
          pendingLeads: 0,
          completedLeads: 0,
          disposedLeads: 0
        });
        setLoading(false);
        return;
      }
      
      setAllLeads(leads);
      
      // Save to localStorage for future use
      localStorage.setItem('dashboardData', JSON.stringify({ leads }));
      
      // Filter leads by selected month
      const filteredLeads = leads.filter(lead => {
        const leadDate = new Date(lead.createdAt || lead.uploadedAt || lead.date || lead.uploadDate || lead.createdDate);
        if (isNaN(leadDate.getTime())) return false;
        const leadMonth = leadDate.toISOString().slice(0, 7);
        return leadMonth === month;
      });
      
      console.log(`📋 Records for ${month}: ${filteredLeads.length}`);
      
      // If no leads for selected month, show all data with a notice
      let displayLeads = filteredLeads;
      let isShowingAll = false;
      
      if (filteredLeads.length === 0) {
        console.log('📋 No records for selected month, showing all records');
        displayLeads = leads;
        isShowingAll = true;
        setShowAllData(true);
      } else {
        setShowAllData(false);
      }
      
      // Calculate metrics
      const today = new Date();
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      
      // 1. Total Collection (amount collected)
      const totalCollection = displayLeads.reduce((sum, lead) => {
        return sum + (parseFloat(lead.collectedAmount) || parseFloat(lead.amountCollected) || parseFloat(lead.collection) || 0);
      }, 0);
      
      // 2. Upcoming PTPs (Promise to Pay)
      const upcomingPTPs = displayLeads.filter(lead => {
        const ptpDate = new Date(lead.ptpDate || lead.promiseDate || lead.nextPTPDate || lead.followUpDate);
        if (isNaN(ptpDate.getTime())) return false;
        const isFuture = ptpDate > today;
        const isPending = lead.ptpStatus === 'Pending' || lead.ptpStatus === 'Promised' || 
                         lead.status === 'PTP' || lead.status === 'Promised' ||
                         lead.ptpStatus === 'Upcoming' || lead.ptpStatus === 'Scheduled';
        return isFuture && isPending;
      });
      
      const totalUpcomingPTP = upcomingPTPs.length;
      const totalUpcomingPTPAmount = upcomingPTPs.reduce((sum, lead) => {
        return sum + (parseFloat(lead.ptpAmount) || parseFloat(lead.promiseAmount) || 0);
      }, 0);
      
      // 3. BPTP (Broken Promise to Pay) from last 2 days
      const bptpData = displayLeads.filter(lead => {
        const ptpDate = new Date(lead.ptpDate || lead.promiseDate || lead.nextPTPDate || lead.followUpDate);
        if (isNaN(ptpDate.getTime())) return false;
        const isBPTP = lead.ptpStatus === 'Broken' || lead.ptpStatus === 'Broke' || 
                      lead.ptpStatus === 'Missed' || lead.status === 'BPTP' ||
                      lead.ptpStatus === 'Broken PTP' || lead.ptpStatus === 'Failed';
        const isInRange = ptpDate >= twoDaysAgo && ptpDate <= today;
        return isBPTP && isInRange;
      });
      
      const totalBPTP = bptpData.length;
      const totalBPTPAmount = bptpData.reduce((sum, lead) => {
        return sum + (parseFloat(lead.ptpAmount) || parseFloat(lead.promiseAmount) || 0);
      }, 0);
      
      // 4. Today's Tasks (follow-ups due today)
      const todayTasks = displayLeads.filter(lead => {
        const followUpDate = new Date(lead.followUpDate || lead.nextFollowUp || lead.nextFollowUpDate || lead.followupDate);
        if (isNaN(followUpDate.getTime())) return false;
        return followUpDate.toDateString() === today.toDateString();
      });
      
      // 5. Status counts
      const pendingLeads = displayLeads.filter(lead => 
        lead.status === 'Pending' || lead.status === 'New' || lead.status === 'Assigned' || 
        lead.status === 'Open' || lead.status === 'Active' || lead.status === 'In Progress'
      ).length;
      
      const completedLeads = displayLeads.filter(lead => 
        lead.status === 'Completed' || lead.status === 'Done' || lead.status === 'Closed' ||
        lead.status === 'Resolved' || lead.status === 'Collected' || lead.status === 'Success'
      ).length;
      
      const disposedLeads = displayLeads.filter(lead => 
        lead.status === 'Disposed' || lead.status === 'Disposed Off' || lead.status === 'Closed Lost' ||
        lead.status === 'Rejected' || lead.status === 'Cancelled'
      ).length;
      
      // 6. Recent Activities (last 10 updated leads)
      const recentActivities = displayLeads
        .filter(lead => lead.updatedAt || lead.lastActivity || lead.createdAt)
        .sort((a, b) => {
          const dateA = new Date(a.updatedAt || a.lastActivity || a.createdAt);
          const dateB = new Date(b.updatedAt || b.lastActivity || b.createdAt);
          if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0;
          return dateB - dateA;
        })
        .slice(0, 10)
        .map(lead => ({
          id: lead.id || `act_${Math.random()}`,
          message: `${lead.name || lead.customerName || 'Unknown'} - ${lead.status || lead.dispositionStatus || 'Updated'}`,
          time: lead.updatedAt || lead.lastActivity || lead.createdAt,
          icon: getActivityIcon(lead.status || lead.dispositionStatus),
          AgreementNumber: lead.id
        }));
      
      setDashboardData({
        totalCollection,
        totalUpcomingPTP,
        totalUpcomingPTPAmount,
        totalBPTP,
        totalBPTPAmount,
        todayTasks: todayTasks.slice(0, 20),
        upcomingPTPs: upcomingPTPs.slice(0, 20),
        bptpData: bptpData.slice(0, 20),
        recentActivities,
        totalLeads: displayLeads.length,
        pendingLeads,
        completedLeads,
        disposedLeads
      });
      
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      let errorMessage = 'Failed to fetch dashboard data';
      if (err.response) {
        errorMessage = err.response.data?.message || 
                      err.response.data?.error || 
                      `Server error: ${err.response.status}`;
      } else if (err.request) {
        errorMessage = 'Cannot connect to server. Please check your network connection.';
      } else {
        errorMessage = err.message || 'An unexpected error occurred';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getActivityIcon = (status) => {
    const iconMap = {
      'Completed': 'fa-check-circle',
      'Pending': 'fa-clock',
      'Disposed': 'fa-trash',
      'PTP': 'fa-phone',
      'Promised': 'fa-handshake',
      'Broken': 'fa-exclamation-triangle',
      'New': 'fa-plus-circle',
      'Assigned': 'fa-user-check',
      'Done': 'fa-check',
      'Closed': 'fa-check-double',
      'Active': 'fa-play',
      'Open': 'fa-folder-open',
      'Success': 'fa-thumbs-up',
      'Failed': 'fa-times-circle',
      'In Progress': 'fa-spinner'
    };
    return iconMap[status] || 'fa-bell';
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
  };

  const handleMonthChange = (event) => {
    const [year, month] = event.target.value.split('-');
    setSelectedMonth(new Date(parseInt(year), parseInt(month) - 1));
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
    return `₹${Number(amount).toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'Completed': 'success',
      'Pending': 'warning',
      'Broken': 'danger',
      'Broke': 'danger',
      'Missed': 'danger',
      'Promised': 'info',
      'Rescheduled': 'primary',
      'Cancelled': 'secondary',
      'Disposed': 'secondary',
      'New': 'info',
      'Assigned': 'primary',
      'PTP': 'warning',
      'Done': 'success',
      'Closed': 'success',
      'Active': 'primary',
      'Open': 'info',
      'Success': 'success',
      'Failed': 'danger',
      'In Progress': 'warning'
    };
    const color = statusMap[status] || 'secondary';
    return <span className={`badge bg-${color}`}>{status || 'N/A'}</span>;
  };

  const getPriorityBadge = (priority) => {
    const priorityMap = {
      'High': 'danger',
      'Medium': 'warning',
      'Low': 'info'
    };
    const color = priorityMap[priority] || 'secondary';
    return <span className={`badge bg-${color}`}>{priority || 'Normal'}</span>;
  };

  const handleCall = (phoneNumber) => {
    if (phoneNumber) {
      window.location.href = `tel:${phoneNumber}`;
    }
  };

  const handleViewLead = (AgreementNumber) => {
    if (AgreementNumber) {
      navigate(`/agent/leads/${AgreementNumber}`);
    }
  };

  // Stats cards configuration
  const statCards = [
    { 
      title: 'My Total Collection', 
      value: formatCurrency(dashboardData.totalCollection), 
      icon: 'fa-money-bill-wave', 
      color: '#2ecc71' 
    },
    { 
      title: 'Total Records', 
      value: dashboardData.totalLeads, 
      icon: 'fa-file-alt', 
      color: '#3498db' 
    },
    { 
      title: 'Upcoming PTPs', 
      value: dashboardData.totalUpcomingPTP, 
      icon: 'fa-calendar-check', 
      color: '#9b59b6',
      subtitle: formatCurrency(dashboardData.totalUpcomingPTPAmount)
    },
    { 
      title: 'BPTP (Last 2 Days)', 
      value: dashboardData.totalBPTP, 
      icon: 'fa-exclamation-triangle', 
      color: '#e74c3c',
      subtitle: formatCurrency(dashboardData.totalBPTPAmount)
    },
    { 
      title: "Today's Tasks", 
      value: dashboardData.todayTasks.length, 
      icon: 'fa-tasks', 
      color: '#f39c12' 
    },
    { 
      title: 'Pending', 
      value: dashboardData.pendingLeads, 
      icon: 'fa-clock', 
      color: '#e67e22' 
    },
    { 
      title: 'Completed', 
      value: dashboardData.completedLeads, 
      icon: 'fa-check-circle', 
      color: '#27ae60' 
    },
    { 
      title: 'Disposed', 
      value: dashboardData.disposedLeads, 
      icon: 'fa-trash', 
      color: '#95a5a6' 
    }
  ];

  if (error) {
    return (
      <Layout>
        <div className="alert alert-danger m-4" role="alert">
          <div className="d-flex align-items-start">
            <i className="fas fa-exclamation-circle me-3 mt-1" style={{ fontSize: '24px' }}></i>
            <div>
              <h5 className="alert-heading">Error Loading Dashboard</h5>
              <p className="mb-2">{error}</p>
              <button 
                className="btn btn-primary btn-sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <i className={`fas fa-sync me-2 ${refreshing ? 'fa-spin' : ''}`}></i>
                {refreshing ? 'Refreshing...' : 'Retry'}
              </button>
            </div>
          </div>
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
            background: white;
            cursor: pointer;
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
            transition: transform 0.3s ease;
          }
          .stats-card:hover .icon {
            transform: scale(1.1);
          }
          .stats-card .stat-value {
            font-size: 24px;
            font-weight: 700;
            margin: 0;
          }
          .stats-card .stat-subtitle {
            font-size: 12px;
            color: #6c757d;
            margin-top: 2px;
          }
          .card-glass {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.06);
          }
          .section-list {
            max-height: 350px;
            overflow-y: auto;
          }
          .section-list::-webkit-scrollbar {
            width: 6px;
          }
          .section-list::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 3px;
          }
          .section-list::-webkit-scrollbar-thumb {
            background: #c1c7cd;
            border-radius: 3px;
          }
          .section-item {
            padding: 12px 16px;
            border-bottom: 1px solid #f1f1f1;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            transition: background-color 0.2s ease;
          }
          .section-item:hover {
            background-color: #f8f9fa;
          }
          .section-item:last-child {
            border-bottom: none;
          }
          .activity-item {
            padding: 12px 16px;
            border-bottom: 1px solid #f1f1f1;
            display: flex;
            align-items: center;
            gap: 12px;
            transition: background-color 0.2s ease;
          }
          .activity-item:hover {
            background-color: #f8f9fa;
          }
          .activity-item .activity-icon {
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background: #667eea20;
            color: #667eea;
            font-size: 14px;
            flex-shrink: 0;
          }
          .activity-item .activity-message {
            flex: 1;
            font-size: 14px;
          }
          .activity-item .activity-time {
            font-size: 12px;
            color: #6c757d;
            flex-shrink: 0;
          }
          .empty-state {
            padding: 30px 20px;
            text-align: center;
            color: #6c757d;
          }
          .empty-state i {
            font-size: 36px;
            margin-bottom: 10px;
            opacity: 0.5;
          }
          .refresh-btn {
            transition: transform 0.3s ease;
          }
          .refresh-btn:hover {
            transform: rotate(180deg);
          }
          .filter-section {
            background: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.06);
            margin-bottom: 20px;
          }
          .action-btn {
            padding: 4px 10px;
            font-size: 12px;
            border-radius: 6px;
            margin: 0 2px;
          }
          .section-title {
            font-size: 16px;
            font-weight: 600;
            color: #1a1a2e;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #f0f0f0;
          }
          @keyframes slideIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .slide-in {
            animation: slideIn 0.3s ease;
          }
          .show-all-notice {
            background: #fff3cd;
            border: 1px solid #ffc107;
            color: #856404;
            padding: 10px 15px;
            border-radius: 8px;
            margin-bottom: 15px;
            font-size: 14px;
          }
        `}
      </style>

      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap">
        <div>
          <h4 className="mb-1">Agent Dashboard</h4>
          <p className="text-muted mb-0">
            Welcome back, {user?.username || 'Agent'}!
            {user?.role && <span className="badge bg-info ms-2 text-white">{user.role}</span>}
          </p>
        </div>
        <div className="mt-2 mt-sm-0 d-flex align-items-center gap-3">
          <span className="badge bg-success">
            <i className="fas fa-circle me-1" style={{ fontSize: '8px' }}></i>
            Online
          </span>
          <span className="text-muted">
            {new Date().toLocaleDateString('en-IN', { 
              day: '2-digit', 
              month: 'short', 
              year: 'numeric' 
            })}
          </span>
          <button 
            className="btn btn-sm btn-outline-secondary refresh-btn"
            onClick={handleRefresh}
            disabled={loading || refreshing}
            title="Refresh Dashboard"
          >
            <i className={`fas fa-sync ${(loading || refreshing) ? 'fa-spin' : ''}`}></i>
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="filter-section">
        <div className="row align-items-center">
          <div className="col-md-6">
            <label className="fw-bold me-2">
              <i className="fas fa-filter me-1"></i>
              Filter by Month/Year:
            </label>
            <input
              type="month"
              className="form-control form-control-sm d-inline-block"
              style={{ width: '200px', display: 'inline-block' }}
              value={selectedMonth.toISOString().slice(0, 7)}
              onChange={handleMonthChange}
            />
            <span className="ms-2 text-muted" style={{ fontSize: '13px' }}>
              Showing data for: <strong>{selectedMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</strong>
            </span>
          </div>
          <div className="col-md-6 text-md-end">
            <span className="badge bg-primary">
              <i className="fas fa-database me-1"></i>
              {loading ? 'Loading...' : `${dashboardData.totalLeads} records`}
            </span>
          </div>
        </div>
      </div>

      {showAllData && dashboardData.totalLeads > 0 && (
        <div className="show-all-notice">
          <i className="fas fa-info-circle me-2"></i>
          No records found for {selectedMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}. 
          Showing all <strong>{dashboardData.totalLeads}</strong> records instead.
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-2">Loading dashboard data...</p>
        </div>
      ) : (
        <>
          {/* Stats Cards Grid */}
          <div className="row g-4 mb-4">
            {statCards.map((stat, index) => (
              <div className="col-md-3 col-sm-6" key={`stat-${index}`}>
                <div className="card stats-card slide-in" style={{ animationDelay: `${(index % 4) * 0.1}s` }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="text-muted mb-1">{stat.title}</h6>
                      <p className="stat-value">{stat.value}</p>
                      {stat.subtitle && (
                        <div className="stat-subtitle">{stat.subtitle}</div>
                      )}
                    </div>
                    <div className="icon" style={{ 
                      background: `${stat.color}20`, 
                      color: stat.color 
                    }}>
                      <i className={`fas ${stat.icon}`}></i>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Today's Tasks */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card card-glass p-3">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0 section-title" style={{ borderBottom: 'none', paddingBottom: '0' }}>
                    <i className="fas fa-tasks me-2 text-primary"></i>
                    Today's Tasks
                    <span className="badge bg-primary ms-2">{dashboardData.todayTasks.length}</span>
                  </h6>
                </div>
                
                {dashboardData.todayTasks.length > 0 ? (
                  <div className="section-list">
                    {dashboardData.todayTasks.map((task) => (
                      <div key={task.id || `task-${Math.random()}`} className="section-item">
                        <div>
                          <div>
                            <strong>{task.name || task.customerName || 'Unknown'}</strong>
                            {getPriorityBadge(task.priority)}
                            {getStatusBadge(task.status || task.dispositionStatus)}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6c757d' }}>
                            <i className="fas fa-phone me-1"></i>
                            {task.phoneNumber || task.phone || 'N/A'}
                            <span className="mx-2">|</span>
                            <i className="fas fa-money-bill me-1"></i>
                            {formatCurrency(task.amount || task.loanAmount || 0)}
                            <span className="mx-2">|</span>
                            <i className="fas fa-clock me-1"></i>
                            {formatDate(task.followUpTime || task.followUpDate || task.nextFollowUp)}
                          </div>
                        </div>
                        <div>
                          <button 
                            className="btn btn-sm btn-success action-btn"
                            onClick={() => handleCall(task.phoneNumber || task.phone)}
                          >
                            <i className="fas fa-phone"></i> Call
                          </button>
                          <button 
                            className="btn btn-sm btn-info action-btn"
                            onClick={() => handleViewLead(task.id)}
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <i className="fas fa-check-circle text-success"></i>
                    <p className="mb-0">No tasks for today! 🎉</p>
                    <small className="text-muted">Tasks will appear here when you have follow-ups scheduled</small>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Upcoming PTPs and BPTP */}
          <div className="row">
            {/* Upcoming PTPs */}
            <div className="col-md-6">
              <div className="card card-glass p-3">
                <h6 className="section-title">
                  <i className="fas fa-calendar-check me-2 text-success"></i>
                  Upcoming PTPs
                  <span className="badge bg-success ms-2">{dashboardData.upcomingPTPs.length}</span>
                </h6>
                
                {dashboardData.upcomingPTPs.length > 0 ? (
                  <div className="section-list">
                    {dashboardData.upcomingPTPs.map((ptp) => (
                      <div key={ptp.id || `ptp-${Math.random()}`} className="section-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                        <div className="d-flex justify-content-between">
                          <div>
                            <strong>{ptp.name || ptp.customerName || 'Unknown'}</strong>
                            {getStatusBadge(ptp.ptpStatus || ptp.status || 'Pending')}
                          </div>
                          <div className="text-success">
                            <strong>{formatCurrency(ptp.ptpAmount || ptp.promiseAmount || ptp.amount || 0)}</strong>
                          </div>
                        </div>
                        <div style={{ fontSize: '12px', color: '#6c757d' }}>
                          <i className="fas fa-calendar me-1"></i>
                          PTP Date: {formatDate(ptp.ptpDate || ptp.promiseDate || ptp.nextPTPDate)}
                          <span className="mx-2">|</span>
                          <i className="fas fa-phone me-1"></i>
                          {ptp.phoneNumber || ptp.phone || 'N/A'}
                        </div>
                        <div className="mt-1">
                          <button 
                            className="btn btn-sm btn-success action-btn"
                            onClick={() => handleCall(ptp.phoneNumber || ptp.phone)}
                          >
                            <i className="fas fa-phone"></i> Call
                          </button>
                          <button 
                            className="btn btn-sm btn-info action-btn"
                            onClick={() => handleViewLead(ptp.id)}
                          >
                            <i className="fas fa-eye"></i> View
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <i className="fas fa-check-circle text-success"></i>
                    <p className="mb-0">No upcoming PTPs</p>
                  </div>
                )}
              </div>
            </div>

            {/* BPTP - Last 2 Days */}
            <div className="col-md-6">
              <div className="card card-glass p-3">
                <h6 className="section-title">
                  <i className="fas fa-exclamation-triangle me-2 text-danger"></i>
                  BPTP (Last 2 Days)
                  <span className="badge bg-danger ms-2">{dashboardData.bptpData.length}</span>
                </h6>
                
                {dashboardData.bptpData.length > 0 ? (
                  <div className="section-list">
                    {dashboardData.bptpData.map((bptp) => (
                      <div key={bptp.id || `bptp-${Math.random()}`} className="section-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                        <div className="d-flex justify-content-between">
                          <div>
                            <strong>{bptp.name || bptp.customerName || 'Unknown'}</strong>
                            <span className="badge bg-danger ms-2">Broken</span>
                          </div>
                          <div className="text-danger">
                            <strong>{formatCurrency(bptp.ptpAmount || bptp.promiseAmount || bptp.amount || 0)}</strong>
                          </div>
                        </div>
                        <div style={{ fontSize: '12px', color: '#6c757d' }}>
                          <i className="fas fa-calendar me-1"></i>
                          Original PTP: {formatDate(bptp.ptpDate || bptp.promiseDate)}
                          <span className="mx-2">|</span>
                          <i className="fas fa-phone me-1"></i>
                          {bptp.phoneNumber || bptp.phone || 'N/A'}
                          <span className="mx-2">|</span>
                          <i className="fas fa-clock me-1"></i>
                          Broke: {formatDate(bptp.updatedAt || bptp.lastActivity)}
                        </div>
                        <div className="mt-1">
                          <button 
                            className="btn btn-sm btn-success action-btn"
                            onClick={() => handleCall(bptp.phoneNumber || bptp.phone)}
                          >
                            <i className="fas fa-phone"></i> Call
                          </button>
                          <button 
                            className="btn btn-sm btn-info action-btn"
                            onClick={() => handleViewLead(bptp.id)}
                          >
                            <i className="fas fa-eye"></i> View
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <i className="fas fa-check-circle text-success"></i>
                    <p className="mb-0">No broken PTPs in last 2 days</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="row mt-4">
            <div className="col-12">
              <div className="card card-glass p-3">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0 section-title" style={{ borderBottom: 'none', paddingBottom: '0' }}>
                    <i className="fas fa-clock me-2 text-info"></i>
                    Recent Activities
                    <span className="badge bg-info ms-2">{dashboardData.recentActivities.length}</span>
                  </h6>
                </div>
                
                {dashboardData.recentActivities.length > 0 ? (
                  <div className="section-list" style={{ maxHeight: '250px' }}>
                    {dashboardData.recentActivities.map((activity) => (
                      <div key={activity.id || `act-${Math.random()}`} className="activity-item slide-in">
                        <div className="activity-icon">
                          <i className={`fas ${activity.icon || 'fa-bell'}`}></i>
                        </div>
                        <span className="activity-message">{activity.message}</span>
                        <span className="activity-time">{formatDate(activity.time)}</span>
                        {activity.AgreementNumber && (
                          <button 
                            className="btn btn-sm btn-outline-info action-btn"
                            onClick={() => handleViewLead(activity.AgreementNumber)}
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <i className="fas fa-inbox"></i>
                    <p className="mb-0">No recent activities</p>
                    <small className="text-muted">Activities will appear here as they happen</small>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Loading Overlay for refresh */}
      {refreshing && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" 
             style={{ background: 'rgba(0,0,0,0.3)', zIndex: 9999 }}>
          <div className="bg-white p-4 rounded-3 shadow text-center">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mb-0">Refreshing dashboard...</p>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AgentDashboard;