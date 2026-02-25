import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  User, LogOut, Calendar, TrendingUp, Activity, 
  Clock, Search, Filter, AlertCircle, Settings, Plus, Sparkles, Trash2,
  Brain, Leaf, MessageSquare, ArrowRight
} from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import './Dashboard.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDisease, setFilterDisease] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchPredictions();
  }, []);

  // Refresh predictions when component becomes visible
  useEffect(() => {
    const handleFocus = () => {
      fetchPredictions();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`${API_BASE_URL}/api/my-predictions`);
      if (response.data.success) {
        setPredictions(response.data.predictions || []);
        if (response.data.count === 0 && response.data.message) {
          // No predictions found - this is not an error
          setError('');
        }
      } else {
        setError(response.data.error || 'Failed to load predictions');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to load predictions';
      setError(errorMessage);
      console.error('Error fetching predictions:', err);
      // If it's just "no predictions", don't show as error
      if (err.response?.status === 200 && err.response?.data?.count === 0) {
        setError('');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleDelete = async (predictionId) => {
    // Confirm deletion
    if (!window.confirm('Are you sure you want to delete this prediction? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(predictionId);
      const response = await axios.delete(`${API_BASE_URL}/api/predictions/${predictionId}`);
      
      if (response.data.success) {
        // Remove from local state
        setPredictions(prev => prev.filter(p => p._id !== predictionId));
        // Optionally show a success message
        console.log('✅ Prediction deleted successfully');
      } else {
        setError(response.data.error || 'Failed to delete prediction');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to delete prediction';
      setError(errorMessage);
      console.error('Error deleting prediction:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 70) return '#10b981';
    if (confidence >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const filteredPredictions = predictions.filter(pred => {
    const matchesSearch = !searchTerm || 
      pred.predicted_disease?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pred.specialist?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = !filterDisease || pred.predicted_disease === filterDisease;
    
    return matchesSearch && matchesFilter;
  });

  const uniqueDiseases = [...new Set(predictions.map(p => p.predicted_disease))].filter(Boolean);
  const stats = {
    total: predictions.length,
    avgConfidence: predictions.length > 0
      ? (predictions.reduce((sum, p) => sum + (p.confidence_score || 0), 0) / predictions.length).toFixed(1)
      : 0,
    highConfidence: predictions.filter(p => p.confidence_score >= 70).length
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-container">
          <LoadingSpinner />
          <p>Loading your predictions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="page-heading"
        >
          Dashboard
        </motion.h1>
        {/* New Prediction Button - Always Visible */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="new-prediction-section"
        >
          <button 
            onClick={() => navigate('/')} 
            className="new-prediction-button"
          >
            <Sparkles size={20} />
            <span>New Prediction</span>
          </button>
        </motion.div>

        {/* Quick Access Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="quick-access-section"
        >
          <h2 className="section-title">Quick Access</h2>
          <div className="quick-access-grid">
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/diseases')}
              className="quick-access-card"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              <div className="quick-access-icon">
                <Brain size={32} />
              </div>
              <h3>Diseases Knowledge</h3>
              <p>Learn about common diseases and health conditions</p>
              <div className="quick-access-arrow">
                <ArrowRight size={20} />
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/remedies')}
              className="quick-access-card"
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
            >
              <div className="quick-access-icon">
                <Leaf size={32} />
              </div>
              <h3>Natural Remedies</h3>
              <p>Discover traditional and natural healing remedies</p>
              <div className="quick-access-arrow">
                <ArrowRight size={20} />
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/appointments')}
              className="quick-access-card"
              style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}
            >
              <div className="quick-access-icon">
                <Calendar size={32} />
              </div>
              <h3>Book Appointment</h3>
              <p>Schedule an appointment with our specialists</p>
              <div className="quick-access-arrow">
                <ArrowRight size={20} />
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/contact')}
              className="quick-access-card"
              style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
            >
              <div className="quick-access-icon">
                <MessageSquare size={32} />
              </div>
              <h3>Contact Us</h3>
              <p>Get in touch with our support team</p>
              <div className="quick-access-arrow">
                <ArrowRight size={20} />
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <div className="stats-grid">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="stat-card"
          >
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <Activity />
            </div>
            <div className="stat-info">
              <h3>{stats.total}</h3>
              <p>Total Predictions</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="stat-card"
          >
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
              <TrendingUp />
            </div>
            <div className="stat-info">
              <h3>{stats.avgConfidence}%</h3>
              <p>Avg Confidence</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="stat-card"
          >
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
              <Clock />
            </div>
            <div className="stat-info">
              <h3>{stats.highConfidence}</h3>
              <p>High Confidence</p>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search predictions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <select
            value={filterDisease}
            onChange={(e) => setFilterDisease(e.target.value)}
            className="filter-select"
          >
            <option value="">All Diseases</option>
            {uniqueDiseases.map(disease => (
              <option key={disease} value={disease}>{disease}</option>
            ))}
          </select>
        </div>

        {/* Predictions List */}
        {error && error !== '' && (
          <div className="error-message">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {!loading && filteredPredictions.length === 0 && !error && (
          <div className="empty-state">
            <Activity size={48} />
            <h3>No predictions found</h3>
            <p>
              {predictions.length === 0
                ? "You haven't made any predictions yet. Start by making a prediction!"
                : "No predictions match your search criteria."}
            </p>
            <button onClick={() => navigate('/')} className="primary-button">
              Make a Prediction
            </button>
          </div>
        )}

        {!loading && filteredPredictions.length > 0 && (
          <div className="predictions-list">
            {filteredPredictions.map((pred, index) => (
              <motion.div
                key={pred._id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="prediction-item"
              >
                <div className="prediction-header">
                  <div>
                    <h3>{pred.predicted_disease}</h3>
                    <p className="prediction-category">{pred.disease_category}</p>
                  </div>
                  <div
                    className="confidence-badge"
                    style={{ backgroundColor: getConfidenceColor(pred.confidence_score) }}
                  >
                    {pred.confidence_score}%
                  </div>
                </div>
                <div className="prediction-details">
                  <div className="detail-row">
                    <span className="detail-label">Specialist:</span>
                    <span className="detail-value">{pred.specialist}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Age:</span>
                    <span className="detail-value">{pred.age} years</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Date:</span>
                    <span className="detail-value">{formatDate(pred.created_at)}</span>
                  </div>
                </div>
                <div className="prediction-actions">
                  <motion.button
                    onClick={() => handleDelete(pred._id)}
                    disabled={deletingId === pred._id}
                    className="delete-button"
                    title="Delete this prediction"
                    whileHover={deletingId !== pred._id ? { scale: 1.05 } : {}}
                    whileTap={deletingId !== pred._id ? { scale: 0.95 } : {}}
                  >
                    {deletingId === pred._id ? (
                      <span className="deleting-text">Deleting...</span>
                    ) : (
                      <>
                        <Trash2 size={16} />
                        <span>Delete</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
