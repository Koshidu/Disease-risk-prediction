import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, User, LogIn, Menu, X, Brain, Leaf, Calendar, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Header.css';

const Header = ({ modelInfo }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { path: '/diseases', label: 'Diseases', icon: <Brain size={16} /> },
    { path: '/remedies', label: 'Remedies', icon: <Leaf size={16} /> },
    { path: '/appointments', label: 'Appointments', icon: <Calendar size={16} /> },
    { path: '/contact', label: 'Contact', icon: <MessageSquare size={16} /> }
  ];

  return (
    <motion.header 
      className="app-header sticky-header"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="header-content">
        <div 
          className="header-title-section" 
          style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
          onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')}
        >
          <div className="logo-container">
            <Activity className="logo-icon" />
          </div>
          <div>
            <h1>PredictaCare</h1>
            <p className="subtitle">AI-Powered Disease Risk Prediction</p>
          </div>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="header-nav">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="nav-link"
            >
              {link.icon}
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>

        <div className="header-right">
          {modelInfo && modelInfo.accuracy && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="model-badge"
            >
              <span className="badge-label">Model Accuracy</span>
              <span className="badge-value">{modelInfo.accuracy.toFixed(1)}%</span>
            </motion.div>
          )}

          {isAuthenticated ? (
            <div className="user-menu">
              <Link to="/dashboard" className="user-button">
                <User size={16} />
                <span>{user?.first_name || 'Dashboard'}</span>
              </Link>
              <Link to="/profile" className="user-button">
                <span>Profile</span>
              </Link>
              <button onClick={handleLogout} className="logout-button-header">
                Logout
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="login-button">
                <LogIn size={16} />
                <span>Login</span>
              </Link>
              <Link to="/signup" className="signup-button">
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            className="mobile-menu-button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mobile-menu"
            >
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="mobile-nav-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              ))}
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className="mobile-nav-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User size={18} />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    to="/profile"
                    className="mobile-nav-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>Profile</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="mobile-nav-link mobile-logout"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="mobile-nav-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LogIn size={18} />
                    <span>Login</span>
                  </Link>
                  <Link
                    to="/signup"
                    className="mobile-nav-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>Sign Up</span>
                  </Link>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
};

export default Header;
