import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import PredictionForm from './components/PredictionForm';
import Results from './components/Results';
import LoadingSpinner from './components/LoadingSpinner';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import DiseasesKnowledge from './components/DiseasesKnowledge';
import NaturalRemedies from './components/NaturalRemedies';
import DoctorAppointments from './components/DoctorAppointments';
import ContactUs from './components/ContactUs';
import axios from 'axios';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function HomePage() {
  const { isAuthenticated } = useAuth();
  const [predictionResult, setPredictionResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formResetKey, setFormResetKey] = useState(0);

  const handlePrediction = async (formData) => {
    setLoading(true);
    setError(null);
    setPredictionResult(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/predict`, formData);
      
      if (response.data.error) {
        throw new Error(response.data.error);
      }

      // Save prediction to database (only if user is logged in)
      if (isAuthenticated) {
        try {
          const saveResponse = await axios.post(`${API_BASE_URL}/api/save-prediction`, {
            ...formData,
            prediction: response.data.prediction,
            timestamp: new Date().toISOString()
          });
          console.log('✅ Prediction saved to database:', saveResponse.data);
        } catch (dbError) {
          console.error('❌ Failed to save prediction to database:', dbError);
          console.error('Error details:', dbError.response?.data);
          // Don't fail the whole request if DB save fails
        }
      } else {
        console.log('ℹ️ User not logged in, prediction not saved to account');
      }

      setPredictionResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPredictionResult(null);
    setError(null);
    setLoading(false);
    // Increment reset key to force form reset
    setFormResetKey(prev => prev + 1);
  };

  return (
    <>
      <main className="main-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="content-wrapper"
        >
          {!predictionResult && !error && !loading && (
            <PredictionForm 
              key={formResetKey}
              onSubmit={handlePrediction} 
              loading={loading}
              resetKey={formResetKey}
            />
          )}

          {loading && (
            <div className="loading-container">
              <LoadingSpinner />
              <p className="loading-text">Analyzing your health data...</p>
            </div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="error-container"
            >
              <div className="error-card">
                <h3>⚠️ Error</h3>
                <p>{error}</p>
                <button onClick={handleReset} className="btn-secondary">
                  Try Again
                </button>
              </div>
            </motion.div>
          )}

          {predictionResult && !loading && (
            <Results 
              result={predictionResult} 
              onReset={handleReset}
              isAuthenticated={isAuthenticated}
            />
          )}
        </motion.div>
      </main>

      <footer className="disclaimer">
        <p>
          ⚠️ <strong>Medical Disclaimer:</strong> This system is for educational purposes only. 
          Always consult with healthcare professionals for medical advice and treatment.
        </p>
      </footer>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout><HomePage /></Layout>} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard"
            element={
              <Layout>
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              </Layout>
            }
          />
          <Route
            path="/profile"
            element={
              <Layout>
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              </Layout>
            }
          />
          <Route
            path="/diseases"
            element={
              <Layout>
                <ProtectedRoute>
                  <DiseasesKnowledge />
                </ProtectedRoute>
              </Layout>
            }
          />
          <Route
            path="/remedies"
            element={
              <Layout>
                <ProtectedRoute>
                  <NaturalRemedies />
                </ProtectedRoute>
              </Layout>
            }
          />
          <Route
            path="/appointments"
            element={
              <Layout>
                <ProtectedRoute>
                  <DoctorAppointments />
                </ProtectedRoute>
              </Layout>
            }
          />
          <Route
            path="/contact"
            element={
              <Layout>
                <ProtectedRoute>
                  <ContactUs />
                </ProtectedRoute>
              </Layout>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
