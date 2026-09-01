// src/components/admin/AddLead.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../Layout/Layout';
import uploadService from '../../services/uploadService';
import { leadApi, uploadApi } from '../../api';

const AddLead = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadComplete, setUploadComplete] = useState(false);
  const [activeUploads, setActiveUploads] = useState([]);
  const [uploadHistory, setUploadHistory] = useState([]);
  const [currentUploadId, setCurrentUploadId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const listenerId = useRef(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [apiError, setApiError] = useState(false);
  const [totalLeadCount, setTotalLeadCount] = useState(0);
  const [allLeads, setAllLeads] = useState([]);
  
  const [allocationMonthYear, setAllocationMonthYear] = useState('');
  const [lenderProcessName, setLenderProcessName] = useState('');
  const [customUploadName, setCustomUploadName] = useState('');

  const sampleColumns = [
    'DND', 'Phone Number', 'Name', 'User ID', 'AgreementNumber',
    'Amount to be pitched(OS)', 'Case Type', 'Loan ID', 'loan_amount',
    'OS', 'Late Payment Fee', 'Settlement', 'overdue_interest',
    'Waiver', 'overdue_principal', 'initial_interest',
    'DisbursementDate', 'InitialDueDate', 'DPD_bucket', 'DPD',
    'Payment Link(Waiver)', 'Payment Link Settlement',
    'current_city', 'current_state', 'ProductName',
    'last_paid_date', 'last_paid_sum', 'Alt Phone Number'
  ];

  useEffect(() => {
    // Load from localStorage first
    const cachedData = loadHistoryFromLocalStorage();
    if (cachedData && cachedData.length > 0) {
      setUploadHistory(cachedData);
    }
    
    // Load data
    loadAllLeadsAndGroup();
    
    listenerId.current = uploadService.addListener((uploads) => {
      console.log('📊 Upload listener triggered:', uploads);
      setActiveUploads(uploads || []);
      
      if (currentUploadId) {
        const upload = uploads.find(u => u.id === currentUploadId);
        if (upload) {
          setUploadProgress(upload.progress || 0);
          if (upload.status === 'COMPLETED') {
            setUploadComplete(true);
            setUploadStatus('✅ Upload Complete!');
            setLoading(false);
            showMessage('Upload completed successfully!', 'success');
            setCurrentUploadId(null);
            
            // Save to localStorage immediately
            const uploadData = {
              id: upload.id,
              fileName: upload.fileName || 'upload.csv',
              uploadName: upload.uploadName || customUploadName || 'Unknown Upload',
              leadCount: upload.result?.count || 0,
              totalRows: upload.result?.count || 0,
              status: 'Completed',
              uploadedAt: new Date().toISOString(),
              allocationMonthYear: allocationMonthYear || 'N/A',
              lenderProcessName: lenderProcessName || 'N/A',
              uploadCount: 1,
              progress: 100
            };
            
            addToHistory(uploadData);
            
            // Reload data after upload
            setTimeout(() => {
              loadAllLeadsAndGroup();
            }, 2000);
            
            setRefreshKey(prev => prev + 1);
            setFiles(prev => prev.filter(f => f.id !== upload.id));
          } else if (upload.status === 'FAILED') {
            setUploadStatus('❌ Upload Failed');
            setLoading(false);
            showMessage('Upload failed. Please try again.', 'danger');
            setCurrentUploadId(null);
          } else if (upload.status === 'CANCELLED') {
            setUploadStatus('Upload Cancelled');
            setLoading(false);
            setCurrentUploadId(null);
          }
        }
      }
    });

    return () => {
      if (listenerId.current) {
        uploadService.removeListener(listenerId.current);
      }
    };
  }, [currentUploadId]);

  useEffect(() => {
    console.log('🔄 Refresh triggered, reloading data...');
    loadAllLeadsAndGroup();
  }, [refreshKey]);

  // Load all leads and group by upload name
  const loadAllLeadsAndGroup = async () => {
    setHistoryLoading(true);
    setApiError(false);
    try {
      console.log('📋 Fetching all leads from backend...');
      
      // Try different methods to get leads
      let response = null;
      if (leadApi.getLeads) {
        response = await leadApi.getLeads();
      } else if (leadApi.getAll) {
        response = await leadApi.getAll();
      } else if (leadApi.list) {
        response = await leadApi.list();
      } else {
        console.warn('No method found to fetch leads');
        // Try localStorage as fallback
        const cachedData = loadHistoryFromLocalStorage();
        if (cachedData && cachedData.length > 0) {
          setUploadHistory(cachedData);
        }
        setHistoryLoading(false);
        return;
      }
      
      let leads = [];
      if (response && response.data) {
        if (Array.isArray(response.data)) {
          leads = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          leads = response.data.data;
        } else if (response.data.leads && Array.isArray(response.data.leads)) {
          leads = response.data.leads;
        }
      }
      
      console.log('📋 Total leads fetched:', leads.length);
      setAllLeads(leads);
      setTotalLeadCount(leads.length);
      
      if (leads.length === 0) {
        console.log('📋 No leads found');
        setUploadHistory([]);
        localStorage.removeItem('uploadHistory');
        setHistoryLoading(false);
        return;
      }
      
      // Group leads by upload name
      const uploadMap = new Map();
      let unknownCount = 0;
      
      leads.forEach(lead => {
        // Try different possible field names for upload name
        const uploadName = lead.uploadName || lead.upload_name || lead.upload || lead.batchName || lead.batch_name || lead.groupName || lead.group_name || 'Unknown Upload';
        
        if (uploadName === 'Unknown Upload' || uploadName === 'N/A' || !uploadName) {
          unknownCount++;
        }
        
        if (!uploadMap.has(uploadName)) {
          uploadMap.set(uploadName, {
            uploadName: uploadName,
            count: 0,
            leads: [],
            firstLead: lead,
            allocationMonthYear: lead.allocationMonthYear || lead.month || lead.allocation_month || 'N/A',
            lenderProcessName: lead.lenderProcessName || lead.lender || lead.processName || 'N/A',
            uploadedAt: lead.createdAt || lead.uploadedAt || lead.timestamp || new Date().toISOString()
          });
        }
        uploadMap.get(uploadName).count++;
        uploadMap.get(uploadName).leads.push(lead);
      });
      
      console.log(`📋 Grouped leads into ${uploadMap.size} groups (${unknownCount} leads without upload name)`);
      
      // Convert to history format
      const historyData = Array.from(uploadMap.values()).map((group, index) => ({
        id: `upload_${index}_${Date.now()}`,
        uploadName: group.uploadName,
        fileName: `${group.uploadName}.csv`,
        leadCount: group.count,
        totalRows: group.count,
        successRows: group.count,
        errorRows: 0,
        uploadCount: 1,
        status: 'Completed',
        uploadedAt: group.uploadedAt,
        completedAt: new Date().toISOString(),
        allocationMonthYear: group.allocationMonthYear,
        lenderProcessName: group.lenderProcessName,
        fileSize: 'N/A',
        progress: 100
      }));
      
      // Sort by uploadedAt (newest first)
      historyData.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
      
      setUploadHistory(historyData);
      console.log('📋 Created history from leads:', historyData.length, 'groups');
      
      // Save to localStorage
      localStorage.setItem('uploadHistory', JSON.stringify(historyData));
      
    } catch (error) {
      console.error('❌ Error fetching leads:', error);
      setApiError(true);
      
      // Use localStorage as fallback
      const cachedData = loadHistoryFromLocalStorage();
      if (cachedData && cachedData.length > 0) {
        setUploadHistory(cachedData);
        console.log('📋 Using cached history from localStorage (fallback)');
      } else {
        setUploadHistory([]);
        showMessage('⚠️ Could not fetch data. Please try again.', 'warning');
      }
    } finally {
      setHistoryLoading(false);
    }
  };

  // Load from localStorage
  const loadHistoryFromLocalStorage = () => {
    try {
      const savedHistory = localStorage.getItem('uploadHistory');
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log('📋 Loaded history entries from localStorage:', parsed.length);
          return parsed;
        }
      }
      return null;
    } catch (e) {
      console.error('Error loading history from localStorage:', e);
      return null;
    }
  };

  // Add upload to history (local backup)
  const addToHistory = (upload) => {
    console.log('📝 Adding upload to history:', upload);
    
    const uploadName = upload.uploadName || customUploadName || 'Unknown Upload';
    const allocationMonth = upload.allocationMonthYear || allocationMonthYear || 'N/A';
    const lenderName = upload.lenderProcessName || lenderProcessName || 'N/A';
    const totalRows = upload.totalRows || upload.leadCount || 0;
    
    const newEntry = {
      id: upload.id || Date.now().toString(),
      fileName: upload.fileName || 'unknown.csv',
      uploadName: uploadName,
      leadCount: totalRows,
      totalRows: totalRows,
      successRows: upload.successRows || totalRows,
      errorRows: upload.errorRows || 0,
      uploadCount: upload.uploadCount || 1,
      status: upload.status || 'Completed',
      uploadedAt: upload.uploadedAt || new Date().toISOString(),
      completedAt: upload.completedAt || new Date().toISOString(),
      allocationMonthYear: allocationMonth,
      lenderProcessName: lenderName,
      fileSize: upload.fileSize || 'N/A',
      progress: upload.progress || 100
    };
    
    console.log('📝 New history entry created:', newEntry);
    
    // Save to localStorage
    let existingHistory = [];
    const savedHistory = localStorage.getItem('uploadHistory');
    if (savedHistory) {
      try {
        existingHistory = JSON.parse(savedHistory);
        if (!Array.isArray(existingHistory)) existingHistory = [];
      } catch (e) {
        existingHistory = [];
      }
    }
    
    const existsIndex = existingHistory.findIndex(item => item.id === newEntry.id);
    if (existsIndex !== -1) {
      existingHistory[existsIndex] = newEntry;
    } else {
      existingHistory = [newEntry, ...existingHistory];
    }
    
    localStorage.setItem('uploadHistory', JSON.stringify(existingHistory));
    setUploadHistory(existingHistory);
    console.log('📝 Updated localStorage with new entry, total:', existingHistory.length);
  };

  const generateUploadName = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const month = allocationMonthYear || 'unknown';
    const landerName = customUploadName.trim() || 'lander';
    return `${landerName}_${timestamp}_${month}`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (typeof bytes === 'string') return bytes;
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validFiles = [];
    
    selectedFiles.forEach(file => {
      if (file.size > 50 * 1024 * 1024) {
        showMessage(`File ${file.name} exceeds 50MB limit`, 'danger');
        return;
      }
      if (!file.name.endsWith('.csv')) {
        showMessage(`File ${file.name} is not a CSV`, 'danger');
        return;
      }
      validFiles.push({
        id: Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        file: file,
        name: file.name,
        size: file.size
      });
    });

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      showMessage(`${validFiles.length} file(s) added successfully`, 'success');
    }
    e.target.value = '';
  };

  const showMessage = (text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 10000);
  };

  const handleUploadFile = async (fileItem) => {
    if (!allocationMonthYear) {
      showMessage('Please select Allocation Month Year', 'danger');
      return;
    }

    if (!lenderProcessName) {
      showMessage('Please enter Lender/Process Name', 'danger');
      return;
    }

    if (!customUploadName.trim()) {
      showMessage('Please enter a Lander Name for the upload', 'danger');
      return;
    }

    setLoading(true);
    setMessage('');
    setUploadProgress(0);
    setUploadStatus('Starting upload...');
    setUploadComplete(false);

    const uploadName = generateUploadName();
    console.log('📤 Generated uploadName:', uploadName);
    
    const mappingData = {
      allocationMonthYear: allocationMonthYear,
      lenderProcessName: lenderProcessName,
      uploadName: uploadName,
      landerName: customUploadName.trim(),
      batchName: customUploadName.trim()
    };

    const fileName = `${uploadName}.csv`;
    console.log('📤 Uploading file with name:', fileName);

    try {
      const uploadId = uploadService.startUpload(
        fileItem.file,
        (progress) => {
          setUploadProgress(progress);
          setUploadStatus(`Uploading ${fileItem.name}... ${progress}%`);
          setCurrentUploadId(uploadId);
        },
        (result) => {
          console.log('✅ Upload complete with result:', result);
          setUploadComplete(true);
          setUploadStatus('✅ Upload Complete!');
          setLoading(false);
          showMessage(`✅ ${fileItem.name} uploaded successfully! ${result.count || 0} leads added.`, 'success');
          setCurrentUploadId(null);
          
          const uploadData = {
            id: uploadId,
            fileName: fileName,
            uploadName: uploadName,
            totalRows: result.count || 0,
            leadCount: result.count || 0,
            status: 'Completed',
            uploadedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            allocationMonthYear: allocationMonthYear,
            lenderProcessName: lenderProcessName,
            fileSize: fileItem.size,
            progress: 100,
            uploadCount: 1
          };
          
          // Add to local history
          addToHistory(uploadData);
          console.log('📝 Added to local history');
          
          // Reload data
          setTimeout(() => {
            loadAllLeadsAndGroup();
          }, 2000);
          
          setRefreshKey(prev => prev + 1);
          setFiles(prev => prev.filter(f => f.id !== fileItem.id));
        },
        (error) => {
          console.error('❌ Upload failed with error:', error);
          setUploadStatus('❌ Upload Failed');
          setLoading(false);
          showMessage(`Failed to upload ${fileItem.name}: ${error.message || 'Please try again'}`, 'danger');
          setCurrentUploadId(null);
        },
        mappingData,
        fileName
      );
      
      console.log('📤 Started upload with ID:', uploadId);
      setCurrentUploadId(uploadId);

    } catch (err) {
      console.error('Error starting upload:', err);
      showMessage('Failed to start upload. Please try again.', 'danger');
      setLoading(false);
    }
  };

  const handleUploadAll = async () => {
    if (files.length === 0) {
      showMessage('No files to upload', 'warning');
      return;
    }

    if (!allocationMonthYear) {
      showMessage('Please select Allocation Month Year', 'danger');
      return;
    }

    if (!lenderProcessName) {
      showMessage('Please enter Lender/Process Name', 'danger');
      return;
    }

    if (!customUploadName.trim()) {
      showMessage('Please enter a Lander Name for the upload', 'danger');
      return;
    }

    for (const fileItem of files) {
      await handleUploadFile(fileItem);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  const handleRemoveFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    showMessage('File removed from queue', 'info');
  };

  const handleClearAllFiles = () => {
    if (files.length === 0) return;
    if (window.confirm('Remove all files from queue?')) {
      setFiles([]);
      showMessage('All files removed', 'info');
    }
  };

  const handleCancelUpload = () => {
    if (currentUploadId) {
      uploadService.cancelUpload(currentUploadId);
      setUploadStatus('Cancelling...');
      showMessage('Upload cancelled', 'warning');
      setLoading(false);
      setCurrentUploadId(null);
      setUploadProgress(0);
    }
  };

  const handleDeleteUpload = async (uploadId, uploadName) => {
    if (!window.confirm(`Delete "${uploadName}" from history?`)) {
      return;
    }

    setDeletingId(uploadId);
    try {
      // Remove from localStorage
      const savedHistory = localStorage.getItem('uploadHistory');
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        const updated = parsed.filter(item => item.id !== uploadId);
        localStorage.setItem('uploadHistory', JSON.stringify(updated));
        setUploadHistory(updated);
        showMessage(`✅ Removed "${uploadName}" from history`, 'success');
      }
      
      // Try to delete from backend if endpoint exists
      try {
        const response = await leadApi.deleteLeadsByUploadName(encodeURIComponent(uploadName));
        if (response.data && response.data.count > 0) {
          showMessage(`✅ Deleted ${response.data.count} leads from "${uploadName}"`, 'success');
        }
      } catch (deleteError) {
        console.warn('Backend delete failed:', deleteError.message);
      }
      
      // Reload data
      setTimeout(() => {
        loadAllLeadsAndGroup();
      }, 1000);
      
    } catch (err) {
      console.error('Error deleting upload:', err);
      showMessage('Failed to delete. Please try again.', 'danger');
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAllHistory = () => {
    if (!window.confirm('Clear all upload history?')) return;
    setUploadHistory([]);
    localStorage.removeItem('uploadHistory');
    showMessage('All history cleared', 'success');
    loadAllLeadsAndGroup();
  };

  const handleDownloadSample = () => {
    const header = sampleColumns.join(',');
    const csvContent = header;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_leads.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status) => {
    if (!status) {
      return <span className="badge bg-secondary">Pending</span>;
    }
    const statusUpper = status.toUpperCase();
    if (statusUpper === 'COMPLETED' || statusUpper === 'COMPLETE') {
      return <span className="badge bg-success"><i className="fas fa-check-circle me-1"></i>Completed</span>;
    } else if (statusUpper === 'UPLOADING' || statusUpper === 'PROCESSING') {
      return <span className="badge bg-warning text-dark"><i className="fas fa-spinner fa-spin me-1"></i>Processing</span>;
    } else if (statusUpper === 'FAILED') {
      return <span className="badge bg-danger"><i className="fas fa-exclamation-circle me-1"></i>Failed</span>;
    } else if (statusUpper === 'CANCELLED') {
      return <span className="badge bg-secondary"><i className="fas fa-ban me-1"></i>Cancelled</span>;
    } else {
      return <span className="badge bg-secondary">Pending</span>;
    }
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

  const hasActiveUpload = activeUploads.some(u => u.status === 'UPLOADING' || u.status === 'PROCESSING');

  const handleRefresh = () => {
    console.log('🔄 Manual refresh triggered...');
    setUploadHistory([]);
    setTimeout(() => {
      loadAllLeadsAndGroup();
      setRefreshKey(prev => prev + 1);
    }, 100);
  };

  // Calculate total statistics
  const totalLeads = uploadHistory.reduce((sum, item) => sum + (item.leadCount || item.totalRows || 0), 0);
  const totalUploads = uploadHistory.length;
  const totalFiles = uploadHistory.reduce((sum, item) => sum + (item.uploadCount || 1), 0);

  return (
    <div className="container-fluid py-4">
      <style>
        {`
          .card-glass {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.06);
          }
          .upload-item {
            transition: all 0.3s ease;
          }
          .upload-item:hover {
            background: rgba(74, 108, 247, 0.05) !important;
            border-color: rgba(74, 108, 247, 0.2) !important;
          }
          .upload-history-list::-webkit-scrollbar {
            width: 6px;
          }
          .upload-history-list::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 3px;
          }
          .upload-history-list::-webkit-scrollbar-thumb {
            background: #c1c7cd;
            border-radius: 3px;
          }
          .upload-history-list::-webkit-scrollbar-thumb:hover {
            background: #a0a7ae;
          }
          .progress-custom {
            height: 28px;
            border-radius: 14px;
            overflow: hidden;
          }
          .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 10px;
            padding: 15px;
            text-align: center;
          }
          .stat-card h3 {
            font-size: 24px;
            font-weight: bold;
            margin: 0;
          }
          .stat-card p {
            margin: 0;
            opacity: 0.9;
            font-size: 12px;
          }
          .stat-card.green {
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
          }
          .stat-card.blue {
            background: linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%);
          }
          .stat-card.orange {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          }
          .history-table-header {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr 1fr 0.8fr;
            gap: 10px;
            padding: 10px 15px;
            background: #f8f9fa;
            border-radius: 8px;
            font-weight: 600;
            font-size: 13px;
            color: #495057;
            border-bottom: 2px solid #dee2e6;
            margin-bottom: 10px;
          }
          .history-row {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr 1fr 0.8fr;
            gap: 10px;
            padding: 12px 15px;
            align-items: center;
            border-bottom: 1px solid #f0f0f0;
            transition: all 0.2s ease;
          }
          .history-row:hover {
            background: rgba(74, 108, 247, 0.03);
          }
          .history-row:last-child {
            border-bottom: none;
          }
          @media (max-width: 768px) {
            .history-table-header, .history-row {
              grid-template-columns: 1fr;
              gap: 5px;
            }
          }
        `}
      </style>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">Upload Master Sheet</h4>
          <p className="text-muted">Bulk upload multiple CSV files</p>
        </div>
        <div>
          <button 
            className="btn btn-outline-primary me-2"
            onClick={handleRefresh}
            disabled={historyLoading}
          >
            <i className={`fas ${historyLoading ? 'fa-spinner fa-spin' : 'fa-sync'} me-1`}></i> 
            {historyLoading ? 'Loading...' : 'Refresh'}
          </button>
          <button className="btn btn-outline-secondary" onClick={() => navigate('/admin')}>
            <i className="fas fa-arrow-left me-2"></i>Back to Admin
          </button>
        </div>
      </div>

      {message && (
        <div className={`alert alert-${messageType} alert-dismissible fade show`} role="alert">
          <i className={`fas fa-${messageType === 'success' ? 'check-circle' : messageType === 'danger' ? 'exclamation-circle' : 'info-circle'} me-2`}></i>
          {message}
          <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="stat-card">
            <h3>{historyLoading ? '...' : totalUploads}</h3>
            <p>Total Uploads</p>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card green">
            <h3>{historyLoading ? '...' : (totalLeadCount > 0 ? totalLeadCount.toLocaleString() : totalLeads.toLocaleString())}</h3>
            <p>Total Leads</p>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card blue">
            <h3>{historyLoading ? '...' : totalFiles}</h3>
            <p>Total Files</p>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card orange">
            <h3>{historyLoading ? '...' : uploadHistory.filter(item => item.status === 'COMPLETED' || item.status === 'Complete').length}</h3>
            <p>Successful Uploads</p>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-8">
          <div className="card card-glass p-4">
            <div className="text-center mb-4">
              <i className="fas fa-file-csv" style={{ fontSize: '48px', color: '#4A6CF7' }}></i>
              <h5 className="mt-3">Upload Master Sheet</h5>
              <p className="text-muted small">Upload multiple CSV files with lead data</p>
            </div>

            <div className="row mb-4">
              <div className="col-md-4">
                <label className="form-label fw-bold">Lander Name *</label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  placeholder="Enter lander name (e.g., lander1)"
                  value={customUploadName}
                  onChange={(e) => setCustomUploadName(e.target.value)}
                  required
                  disabled={loading || hasActiveUpload}
                />
                <small className="text-muted">Name for this upload batch</small>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-bold">Allocation Month Year *</label>
                <input
                  type="month"
                  className="form-control form-control-lg"
                  value={allocationMonthYear}
                  onChange={(e) => setAllocationMonthYear(e.target.value)}
                  required
                  disabled={loading || hasActiveUpload}
                />
                <small className="text-muted">Select the allocation month for all leads</small>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-bold">Lender / Process Name *</label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  placeholder="Enter lender or process name"
                  value={lenderProcessName}
                  onChange={(e) => setLenderProcessName(e.target.value)}
                  required
                  disabled={loading || hasActiveUpload}
                />
                <small className="text-muted">This will be applied to all leads in this upload</small>
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label">Select CSV Files</label>
              <input
                type="file"
                className="form-control form-control-lg"
                accept=".csv"
                multiple
                onChange={handleFileChange}
                disabled={loading || hasActiveUpload}
              />
              <small className="text-muted d-block mt-2">
                Select multiple CSV files at once. Max file size: 50MB each.
                Required columns: <strong>Phone Number</strong>, <strong>Name</strong>
              </small>
            </div>

            {files.length > 0 && (
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="mb-0">Files to Upload ({files.length})</h6>
                  <div>
                    <button 
                      className="btn btn-sm btn-success me-2"
                      onClick={handleUploadAll}
                      disabled={loading || hasActiveUpload}
                    >
                      <i className="fas fa-upload me-1"></i> Upload All
                    </button>
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={handleClearAllFiles}
                      disabled={loading || hasActiveUpload}
                    >
                      <i className="fas fa-trash me-1"></i> Clear All
                    </button>
                  </div>
                </div>
                <div className="file-queue">
                  {files.map((fileItem) => (
                    <div key={fileItem.id} className="file-item d-flex justify-content-between align-items-center p-2 mb-2" style={{
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.06)'
                    }}>
                      <div>
                        <i className="fas fa-file-csv text-primary me-2"></i>
                        <span>{fileItem.name}</span>
                        <small className="text-muted ms-2">({formatFileSize(fileItem.size)})</small>
                      </div>
                      <div>
                        <button 
                          className="btn btn-sm btn-outline-primary me-1"
                          onClick={() => handleUploadFile(fileItem)}
                          disabled={loading || hasActiveUpload}
                        >
                          <i className="fas fa-upload"></i>
                        </button>
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => handleRemoveFile(fileItem.id)}
                          disabled={loading || hasActiveUpload}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(uploadProgress > 0 || loading) && (
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <small className="text-muted">{uploadStatus || 'Uploading...'}</small>
                  <small className="text-muted fw-bold">{uploadProgress}%</small>
                </div>
                <div className="progress progress-custom">
                  <div 
                    className={`progress-bar ${uploadProgress < 100 ? 'progress-bar-striped progress-bar-animated' : ''}`}
                    role="progressbar" 
                    style={{ 
                      width: `${uploadProgress}%`,
                      background: uploadProgress === 100 
                        ? 'linear-gradient(90deg, #2D9B7A 0%, #3A8A8A 100%)' 
                        : 'linear-gradient(90deg, #4A6CF7 0%, #5C7CFA 100%)',
                      transition: 'width 0.5s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: 'white'
                    }}
                  >
                    {uploadProgress === 100 ? '✅ 100% Complete!' : `${uploadProgress}%`}
                  </div>
                </div>
                {uploadProgress === 100 ? (
                  <div className="mt-2 text-center">
                    <span className="badge bg-success" style={{ fontSize: '14px', padding: '6px 16px' }}>
                      <i className="fas fa-check-circle me-1"></i> Upload Complete
                    </span>
                  </div>
                ) : uploadProgress > 0 && (
                  <div className="mt-2 text-center">
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={handleCancelUpload}
                      disabled={uploadProgress === 100}
                    >
                      <i className="fas fa-times me-1"></i> Cancel Upload
                    </button>
                    <small className="text-muted d-block mt-1">Upload continues even if you leave this page</small>
                  </div>
                )}
              </div>
            )}

            <hr className="my-4" />
            
            <div>
              <h6 className="mb-2">CSV Format Preview</h6>
              <div className="bg-light p-3 rounded" style={{ fontSize: '12px', overflow: 'auto' }}>
                <code>
                  {sampleColumns.join(', ')}
                </code>
              </div>
              <button 
                className="btn btn-sm btn-outline-primary mt-2"
                onClick={handleDownloadSample}
              >
                <i className="fas fa-download me-2"></i>Download Sample CSV
              </button>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card card-glass p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0">
                <i className="fas fa-history me-2"></i>
                Upload History
              </h6>
              <div className="d-flex gap-2">
                {uploadHistory.length > 0 && (
                  <button 
                    className="btn btn-sm btn-outline-danger"
                    onClick={handleClearAllHistory}
                  >
                    <i className="fas fa-trash-alt me-1"></i> Clear All
                  </button>
                )}
                <span className="badge bg-primary">{uploadHistory.length} records</span>
              </div>
            </div>
            
            {historyLoading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="text-muted mt-2">Loading upload history...</p>
              </div>
            ) : uploadHistory.length > 0 ? (
              <>
                <div className="history-table-header">
                  <span>Upload Name</span>
                  <span>Leads</span>
                  <span>Files</span>
                  <span>Status</span>
                  <span>Actions</span>
                </div>
                
                <div className="upload-history-list" style={{ maxHeight: '450px', overflowY: 'auto' }}>
                  {uploadHistory.map((upload) => (
                    <div key={upload.id} className="history-row">
                      <div>
                        <div style={{ fontWeight: 500, fontSize: '13px' }}>
                          {upload.uploadName || upload.fileName || 'Unknown Upload'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#6c757d' }}>
                          {formatDate(upload.uploadedAt)}
                        </div>
                        {upload.allocationMonthYear && upload.allocationMonthYear !== 'N/A' && (
                          <div style={{ fontSize: '10px', color: '#6c757d', marginTop: '2px' }}>
                            <span className="badge bg-light text-dark">{upload.allocationMonthYear}</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="badge bg-primary" style={{ fontSize: '12px' }}>
                          {upload.leadCount || upload.totalRows || 0}
                        </span>
                      </div>
                      <div>
                        <span className="badge bg-info" style={{ fontSize: '12px' }}>
                          {upload.uploadCount || 1}
                        </span>
                      </div>
                      <div>
                        {getStatusBadge(upload.status)}
                      </div>
                      <div>
                        <div className="d-flex gap-1">
                          <button 
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteUpload(upload.id, upload.uploadName || upload.fileName)}
                            disabled={deletingId === upload.id}
                            title="Delete from history"
                            style={{ padding: '2px 6px' }}
                          >
                            {deletingId === upload.id ? (
                              <span className="spinner-border spinner-border-sm"></span>
                            ) : (
                              <i className="fas fa-trash" style={{ fontSize: '12px' }}></i>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <i className="fas fa-inbox" style={{ fontSize: '48px', color: '#dee2e6' }}></i>
                <p className="text-muted mt-3" style={{ fontSize: '16px' }}>
                  <strong>No uploads found</strong>
                </p>
                <p className="text-muted small">
                  {totalLeadCount > 0 ? `You have ${totalLeadCount.toLocaleString()} leads but no upload groups found.` : 'Upload your first CSV file to see it here.'}
                </p>
                <button 
                  className="btn btn-primary mt-2"
                  onClick={() => {
                    const fileInput = document.querySelector('input[type="file"]');
                    if (fileInput) fileInput.click();
                  }}
                >
                  <i className="fas fa-upload me-1"></i> Upload Now
                </button>
                {totalLeadCount > 0 && (
                  <button 
                    className="btn btn-outline-secondary mt-2 ms-2"
                    onClick={handleRefresh}
                  >
                    <i className="fas fa-sync me-1"></i> Refresh
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddLead;