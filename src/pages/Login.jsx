import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Login.css'; // External CSS file

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const expiry = localStorage.getItem('tokenExpiry');
      if (expiry && parseInt(expiry) > Date.now()) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const role = user.role || '';
        if (role === 'SUPER_ADMIN' || role === 'ROLE_SUPER_ADMIN' || 
            role === 'ADMIN' || role === 'ROLE_ADMIN') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        // Token expired
        localStorage.removeItem('token');
        localStorage.removeItem('tokenExpiry');
        localStorage.removeItem('user');
      }
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password);
    
    if (result.success) {
      const user = result.data;
      const role = user.role || '';
      
      // Store token expiry (8 hours from now)
      if (result.token) {
        localStorage.setItem('tokenExpiry', (Date.now() + 8 * 60 * 60 * 1000).toString());
        localStorage.setItem('tokenCreated', Date.now().toString());
      }
      
      if (role === 'SUPER_ADMIN' || role === 'ROLE_SUPER_ADMIN' || 
          role === 'ADMIN' || role === 'ROLE_ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(result.error || 'Login failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      {/* Background Blobs */}
      <div className="login-bg">
        <div className="login-bg-blob blob-1"></div>
        <div className="login-bg-blob blob-2"></div>
        <div className="login-bg-blob blob-3"></div>
      </div>

      {/* Login Card */}
      <div className="login-card-wrapper">
        <div className="login-card">
          <div className="login-brand">
            <div className="login-logo">
              <i className="fas fa-cubes"></i>
            </div>
            <h1>Master CRM</h1>
            <p>Lead Management System</p>
            <span className="session-badge">🔒 8-hour session</span>
          </div>

          {error && (
            <div className="login-error">
              <i className="fas fa-exclamation-circle"></i>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="username">Email / Username</label>
              <div className="input-wrapper">
                <i className="fas fa-envelope"></i>
                <input
                  id="username"
                  type="text"
                  placeholder="Enter your email or username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <i className="fas fa-lock"></i>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="remember-me">
                <input type="checkbox" /> Remember me
              </label>
              <Link to="/forgot-password" className="forgot-link">
                Forgot password?
              </Link>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Logging in...
                </>
              ) : (
                'Login to Dashboard'
              )}
            </button>
          </form>

          <div className="login-footer">
            <p>
              Don't have an account? <Link to="/register">Register here</Link>
            </p>
            <small>Registration requires admin approval</small>
            <small className="session-info">🔒 Session expires after 8 hours</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
