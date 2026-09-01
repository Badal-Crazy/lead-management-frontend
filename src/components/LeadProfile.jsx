import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from './Layout/Layout';

const API_URL = 'http://192.168.1.4:8080/api';

const LeadProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [dispositions, setDispositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('personal');

  useEffect(() => {
    if (id) {
      fetchLeadDetails();
      fetchDispositions();
    } else {
      setError('No lead ID provided');
      setLoading(false);
    }
  }, [id]);

  const fetchLeadDetails = async () => {
    try {
      console.log('Fetching lead details for ID:', id);
      const response = await axios.get(`${API_URL}/leads/${id}`);
      console.log('Lead details response:', response.data);
      setLead(response.data);
    } catch (err) {
      console.error('Failed to load lead details:', err);
      setError(err.response?.data?.error || 'Failed to load lead details');
    }
  };

  const fetchDispositions = async () => {
    try {
      console.log('Fetching dispositions for lead ID:', id);
      const response = await axios.get(`${API_URL}/dispositions/lead/${id}`);
      console.log('Dispositions response:', response.data);
      setDispositions(response.data || []);
    } catch (err) {
      console.error('Failed to fetch dispositions:', err);
      setDispositions([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return date;
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0';
    return Number(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleDispose = () => {
    if (lead?.id) {
      navigate(`/dispose/${lead.id}`);
    } else if (lead?.id) {
      navigate(`/dispose/${lead.agreementNumber}`);
    } else {
      navigate(`/dispose/${id}`);
    }
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: 'fa-user' },
    { id: 'loan', label: 'Loan Details', icon: 'fa-hand-holding-usd' },
    { id: 'payment', label: 'Payment History', icon: 'fa-credit-card' },
    { id: 'disposition', label: 'Dispositions', icon: 'fa-history' },
  ];

  const renderPersonalInfo = () => (
    <div className="tab-content">
      <div className="info-grid">
        <div className="info-item">
          <label>Agreement Number</label>
          <span className="text-primary fw-bold">{lead.agreementNumber || 'N/A'}</span>
        </div>
        <div className="info-item">
          <label>Name</label>
          <span>{lead.name || 'N/A'}</span>
        </div>
        <div className="info-item">
          <label>Phone Number</label>
          <span>{lead.phoneNumber || 'N/A'}</span>
        </div>
        <div className="info-item">
          <label>Alt Phone Number</label>
          <span>{lead.altPhoneNumber || 'N/A'}</span>
        </div>
        <div className="info-item">
          <label>User ID</label>
          <span>{lead.userId || 'N/A'}</span>
        </div>
        <div className="info-item">
          <label>Email</label>
          <span>{lead.email || 'N/A'}</span>
        </div>
        <div className="info-item">
          <label>DND</label>
          <span>{lead.dnd || 'No'}</span>
        </div>
        <div className="info-item">
          <label>Current City</label>
          <span>{lead.currentCity || 'N/A'}</span>
        </div>
        <div className="info-item">
          <label>Current State</label>
          <span>{lead.currentState || 'N/A'}</span>
        </div>
        <div className="info-item">
          <label>Product Name</label>
          <span>{lead.productName || 'N/A'}</span>
        </div>
        <div className="info-item">
          <label>Lender/Process Name</label>
          <span>{lead.lenderProcessName || 'N/A'}</span>
        </div>
        <div className="info-item">
          <label>Allocation Month Year</label>
          <span>{lead.allocationMonthYear || 'N/A'}</span>
        </div>
      </div>
    </div>
  );

  const renderLoanDetails = () => (
    <div className="tab-content">
      <div className="info-grid">
        <div className="info-item">
          <label>Agreement Number</label>
          <span className="text-primary fw-bold">{lead.agreementNumber || 'N/A'}</span>
        </div>
        <div className="info-item">
          <label>Amount to Pitch</label>
          <span>₹{formatCurrency(lead.amountToPitch)}</span>
        </div>
        <div className="info-item">
          <label>OS Amount</label>
          <span>₹{formatCurrency(lead.os)}</span>
        </div>
        <div className="info-item">
          <label>Late Payment Fee</label>
          <span>₹{formatCurrency(lead.latePaymentFee)}</span>
        </div>
        <div className="info-item">
          <label>Settlement Amount</label>
          <span>₹{formatCurrency(lead.settlementAmount)}</span>
        </div>
        <div className="info-item">
          <label>Overdue Interest</label>
          <span>₹{formatCurrency(lead.overdueInterest)}</span>
        </div>
        <div className="info-item">
          <label>Waiver Amount</label>
          <span>₹{formatCurrency(lead.waiverAmount)}</span>
        </div>
        <div className="info-item">
          <label>Overdue Principal</label>
          <span>₹{formatCurrency(lead.overduePrincipal)}</span>
        </div>
        <div className="info-item">
          <label>Initial Interest</label>
          <span>₹{formatCurrency(lead.initialInterest)}</span>
        </div>
        <div className="info-item">
          <label>Disbursement Date</label>
          <span>{formatDate(lead.disbursementDate)}</span>
        </div>
        <div className="info-item">
          <label>Initial Due Date</label>
          <span>{formatDate(lead.initialDueDate)}</span>
        </div>
        <div className="info-item">
          <label>Bucket Range</label>
          <span>{lead.bucketRange || 'N/A'}</span>
        </div>
        <div className="info-item">
          <label>DPD</label>
          <span>{lead.dpd || '0'}</span>
        </div>
        <div className="info-item">
          <label>Payment Link (Waiver)</label>
          {lead.paymentLinkWaiver ? (
            <a 
              href={lead.paymentLinkWaiver} 
              target="_blank" 
              rel="noopener noreferrer"
              className="payment-link"
            >
              <i className="fas fa-external-link-alt me-1"></i>
              {lead.paymentLinkWaiver.length > 30 
                ? lead.paymentLinkWaiver.substring(0, 30) + '...' 
                : lead.paymentLinkWaiver}
            </a>
          ) : (
            <span>N/A</span>
          )}
        </div>
        <div className="info-item">
          <label>Payment Link (Settlement)</label>
          {lead.paymentLinkSettlement ? (
            <a 
              href={lead.paymentLinkSettlement} 
              target="_blank" 
              rel="noopener noreferrer"
              className="payment-link"
            >
              <i className="fas fa-external-link-alt me-1"></i>
              {lead.paymentLinkSettlement.length > 30 
                ? lead.paymentLinkSettlement.substring(0, 30) + '...' 
                : lead.paymentLinkSettlement}
            </a>
          ) : (
            <span>N/A</span>
          )}
        </div>
      </div>
    </div>
  );

  const renderPaymentHistory = () => (
    <div className="tab-content">
      <div className="info-grid">
        <div className="info-item">
          <label>Last Paid Date</label>
          <span>{formatDate(lead.lastPaidDate)}</span>
        </div>
        <div className="info-item">
          <label>Last Paid Sum</label>
          <span>₹{formatCurrency(lead.lastPaidSum)}</span>
        </div>
        <div className="info-item">
          <label>Total OS</label>
          <span>₹{formatCurrency(lead.os)}</span>
        </div>
        <div className="info-item">
          <label>Settlement Amount</label>
          <span>₹{formatCurrency(lead.settlementAmount)}</span>
        </div>
        <div className="info-item">
          <label>Waiver Amount</label>
          <span>₹{formatCurrency(lead.waiverAmount)}</span>
        </div>
        <div className="info-item">
          <label>Overdue Principal</label>
          <span>₹{formatCurrency(lead.overduePrincipal)}</span>
        </div>
      </div>
    </div>
  );

  const renderDispositions = () => (
    <div className="tab-content">
      {dispositions.length > 0 ? (
        <div className="disposition-list">
          {dispositions.map((disp, index) => (
            <div key={index} className="disposition-item">
              <div className="disposition-header">
                <div className="disposition-time">
                  <i className="fas fa-clock me-1"></i>
                  {formatDate(disp.createdAt)}
                </div>
                <span className={`disposition-badge ${disp.dispositionStatus?.toLowerCase() || ''}`}>
                  {disp.dispositionStatus || 'N/A'}
                </span>
              </div>
              <div className="disposition-body">
                <div className="disposition-row">
                  <span className="disposition-label">Amount:</span>
                  <span className="disposition-value">₹{formatCurrency(disp.amount || disp.paymentAmount || 0)}</span>
                </div>
                {(disp.callDate || disp.callTime) && (
                  <div className="disposition-row">
                    <span className="disposition-label">Call Date/Time:</span>
                    <span className="disposition-value">
                      {disp.callDate || 'N/A'} {disp.callTime || ''}
                    </span>
                  </div>
                )}
                {(disp.paymentDate) && (
                  <div className="disposition-row">
                    <span className="disposition-label">Payment Date:</span>
                    <span className="disposition-value">{formatDate(disp.paymentDate)}</span>
                  </div>
                )}
                {disp.notes && (
                  <div className="disposition-row">
                    <span className="disposition-label">Remarks:</span>
                    <span className="disposition-value">{disp.notes}</span>
                  </div>
                )}
                <div className="disposition-row">
                  <span className="disposition-label">User:</span>
                  <span className="disposition-value">
                    <i className="fas fa-user me-1"></i>
                    {disp.disposedBy || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <i className="fas fa-history" style={{ fontSize: '48px', color: '#ccc' }}></i>
          <p className="text-muted mt-3">No dispositions recorded yet</p>
          <button 
            className="btn btn-primary btn-sm mt-2"
            onClick={handleDispose}
          >
            <i className="fas fa-plus me-1"></i> Add Disposition
          </button>
        </div>
      )}
    </div>
  );

  const renderTabContent = () => {
    switch(activeTab) {
      case 'personal':
        return renderPersonalInfo();
      case 'loan':
        return renderLoanDetails();
      case 'payment':
        return renderPaymentHistory();
      case 'disposition':
        return renderDispositions();
      default:
        return renderPersonalInfo();
    }
  };

  // Show loading state
  if (loading) {
    return (
      <Layout>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div>
          <p className="mt-3 text-muted">Loading customer profile...</p>
        </div>
      </Layout>
    );
  }

  // Show error state
  if (error || !lead) {
    return (
      <Layout>
        <div className="text-center py-5">
          <i className="fas fa-exclamation-circle" style={{ fontSize: '48px', color: '#dc3545' }}></i>
          <h5 className="mt-3 text-danger">Error loading profile</h5>
          <p className="text-muted">{error || 'Lead not found'}</p>
          <button 
            className="btn btn-primary mt-2"
            onClick={() => navigate('/search')}
          >
            <i className="fas fa-arrow-left me-2"></i>Back to Search
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <style>{`
        .profile-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .profile-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .profile-title {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .back-btn {
          padding: 8px 16px;
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #333;
          transition: all 0.2s;
        }

        .back-btn:hover {
          background: #f5f5f5;
        }

        .dispose-btn {
          padding: 10px 24px;
          background: #28a745;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
          color: white;
          transition: all 0.2s;
        }

        .dispose-btn:hover {
          background: #218838;
        }

        .customer-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          text-align: center;
          margin-bottom: 20px;
        }

        .avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 12px;
          font-size: 32px;
          font-weight: 700;
          color: white;
        }

        .customer-name {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
          color: #1a1a2e;
        }

        .customer-detail {
          color: #6c757d;
          font-size: 13px;
          margin: 2px 0 0 0;
        }

        .tabs-container {
          background: white;
          border-radius: 12px;
          padding: 0;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          overflow: hidden;
        }

        .tabs-header {
          display: flex;
          border-bottom: 1px solid #e8e8f0;
          overflow-x: auto;
          background: #fafafa;
        }

        .tab-btn {
          padding: 14px 24px;
          background: none;
          border: none;
          font-size: 14px;
          font-weight: 500;
          color: #6c757d;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 3px solid transparent;
          white-space: nowrap;
        }

        .tab-btn:hover {
          color: #1a1a2e;
          background: #f5f5f5;
        }

        .tab-btn.active {
          color: #4A6CF7;
          border-bottom-color: #4A6CF7;
          background: white;
        }

        .tab-content {
          padding: 24px;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 16px;
        }

        .info-item {
          padding: 12px 16px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #f0f0f0;
        }

        .info-item label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          color: #8a8aaa;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .info-item span {
          font-size: 14px;
          font-weight: 500;
          color: #1a1a2e;
          word-break: break-word;
        }

        .info-item .text-primary {
          color: #4A6CF7 !important;
        }

        .info-item .fw-bold {
          font-weight: 700 !important;
        }

        .payment-link {
          color: #4A6CF7;
          text-decoration: none;
          font-weight: 500;
          font-size: 14px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: all 0.2s;
          word-break: break-all;
        }

        .payment-link:hover {
          color: #2D4BA8;
          text-decoration: underline;
        }

        .payment-link i {
          font-size: 12px;
        }

        .disposition-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .disposition-item {
          background: #f8f9fa;
          border: 1px solid #e8e8f0;
          border-radius: 10px;
          padding: 16px 20px;
          transition: all 0.2s;
        }

        .disposition-item:hover {
          border-color: #667eea;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
        }

        .disposition-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e8e8f0;
        }

        .disposition-time {
          font-size: 13px;
          color: #6c757d;
        }

        .disposition-time i {
          color: #4A6CF7;
        }

        .disposition-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .disposition-badge.ptp { background: #fff3cd; color: #856404; }
        .disposition-badge.paid { background: #d4edda; color: #155724; }
        .disposition-badge.partpaid { background: #cce5ff; color: #004085; }
        .disposition-badge.cb { background: #e2e3e5; color: #383d41; }
        .disposition-badge.rtp { background: #d1ecf1; color: #0c5460; }
        .disposition-badge.rnr { background: #f8d7da; color: #721c24; }
        .disposition-badge.lm { background: #e2e3e5; color: #383d41; }

        .disposition-body {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .disposition-row {
          display: flex;
          gap: 8px;
          font-size: 14px;
        }

        .disposition-label {
          color: #6c757d;
          min-width: 100px;
          font-weight: 500;
        }

        .disposition-value {
          color: #1a1a2e;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .profile-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .profile-title {
            width: 100%;
          }

          .dispose-btn {
            width: 100%;
            justify-content: center;
          }

          .tabs-header {
            flex-wrap: nowrap;
          }

          .tab-btn {
            padding: 10px 16px;
            font-size: 13px;
          }

          .info-grid {
            grid-template-columns: 1fr;
          }

          .disposition-row {
            flex-direction: column;
            gap: 2px;
          }

          .disposition-label {
            min-width: auto;
          }

          .disposition-header {
            flex-direction: column;
            gap: 8px;
            align-items: flex-start;
          }
        }

        @media (max-width: 480px) {
          .tab-btn span {
            display: none;
          }

          .tab-btn i {
            font-size: 18px;
          }

          .payment-link {
            font-size: 12px;
          }
        }
      `}</style>

      <div className="profile-container">
        {/* Header */}
        <div className="profile-header">
          <div className="profile-title">
            <button className="back-btn" onClick={() => navigate('/search')}>
              <i className="fas fa-arrow-left"></i> Back
            </button>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a2e', margin: 0 }}>
                Customer Profile
              </h1>
            </div>
          </div>
          <button className="dispose-btn" onClick={handleDispose}>
            <i className="fas fa-plus"></i> Dispose
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px' }}>
          {/* Left Sidebar */}
          <div>
            <div className="customer-card">
              <div className="avatar">
                {lead.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <h3 className="customer-name">{lead.name || 'N/A'}</h3>
              <p className="customer-detail">
                <i className="fas fa-phone" style={{ marginRight: '6px' }}></i>
                {lead.phoneNumber || 'N/A'}
              </p>
              <p className="customer-detail">
                <i className="fas fa-envelope" style={{ marginRight: '6px' }}></i>
                {lead.email || 'N/A'}
              </p>
              <p className="customer-detail" style={{ fontWeight: 'bold', color: '#4A6CF7' }}>
                <i className="fas fa-file-contract" style={{ marginRight: '6px' }}></i>
                Agreement: {lead.agreementNumber || 'N/A'}
              </p>
              <div style={{ marginTop: '12px' }}>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: lead.status === 'Pending' ? '#fff3cd' : '#d4edda',
                  color: lead.status === 'Pending' ? '#856404' : '#155724'
                }}>
                  {lead.status || 'Pending'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="tabs-container">
            <div className="tabs-header">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <i className={`fas ${tab.icon}`}></i>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
            <div className="tab-content">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LeadProfile;
