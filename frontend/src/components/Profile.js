import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  User, Mail, Calendar, Save, Edit2, ArrowLeft, 
  CheckCircle, AlertCircle, Lock, UserCircle 
} from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import './Profile.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: ''
  });

  useEffect(() => {
    if (user) {
      // Format date for input field (YYYY-MM-DD)
      let formattedDate = '';
      if (user.date_of_birth) {
        try {
          const date = new Date(user.date_of_birth);
          formattedDate = date.toISOString().split('T')[0];
        } catch (e) {
          formattedDate = '';
        }
      }
      
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        date_of_birth: formattedDate
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.put(`${API_BASE_URL}/api/profile`, formData);
      if (response.data.success) {
        setSuccess('Profile updated successfully!');
        setIsEditing(false);
        // Refresh user data
        window.location.reload();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        date_of_birth: user.date_of_birth || ''
      });
    }
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading-container">
          <LoadingSpinner />
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-content">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="page-heading"
        >
          Profile
        </motion.h1>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="profile-message error"
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="profile-message success"
          >
            <CheckCircle size={18} />
            <span>{success}</span>
          </motion.div>
        )}

        <div className="profile-section">
          <div className="section-header">
            <h2>Personal Information</h2>
            {!isEditing && (
              <button onClick={() => setIsEditing(true)} className="edit-button">
                <Edit2 size={18} />
                Edit Profile
              </button>
            )}
          </div>

          <div className="profile-form">
            <div className="form-row">
              <div className="form-group">
                <label>
                  <User size={18} />
                  First Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className="profile-input"
                  />
                ) : (
                  <div className="profile-value">{formData.first_name || 'Not set'}</div>
                )}
              </div>

              <div className="form-group">
                <label>
                  <User size={18} />
                  Last Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="profile-input"
                  />
                ) : (
                  <div className="profile-value">{formData.last_name || 'Not set'}</div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>
                <Mail size={18} />
                Email Address
              </label>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="profile-input"
                  disabled
                />
              ) : (
                <div className="profile-value">{formData.email}</div>
              )}
              {isEditing && (
                <p className="field-hint">Email cannot be changed</p>
              )}
            </div>

            <div className="form-group">
              <label>
                <Calendar size={18} />
                Date of Birth
              </label>
              {isEditing ? (
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  className="profile-input"
                />
              ) : (
                <div className="profile-value">{formatDate(formData.date_of_birth)}</div>
              )}
            </div>

            <div className="form-group">
              <label>
                <User size={18} />
                Phone Number
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="profile-input"
                  placeholder="+1 (555) 123-4567"
                />
              ) : (
                <div className="profile-value">{formData.phone || 'Not set'}</div>
              )}
            </div>

            {isEditing && (
              <div className="form-actions">
                <button
                  onClick={handleCancel}
                  className="cancel-button"
                  disabled={saving}
                >
                  Cancel
                </button>
                <motion.button
                  onClick={handleSave}
                  className="save-button"
                  disabled={saving}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {saving ? (
                    <>
                      <LoadingSpinner />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save Changes
                    </>
                  )}
                </motion.button>
              </div>
            )}
          </div>
        </div>

        <div className="profile-section">
          <div className="section-header">
            <h2>Account Information</h2>
          </div>
          <div className="account-info">
            <div className="info-item">
              <span className="info-label">Member Since</span>
              <span className="info-value">
                {user?.created_at 
                  ? formatDate(user.created_at)
                  : 'N/A'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Last Login</span>
              <span className="info-value">
                {user?.last_login 
                  ? formatDate(user.last_login)
                  : 'Never'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Account Status</span>
              <span className="info-value status-active">Active</span>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <div className="section-header">
            <h2>Security</h2>
          </div>
          <div className="security-actions">
            <button className="security-button">
              <Lock size={18} />
              Change Password
            </button>
            <button onClick={logout} className="security-button danger">
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
