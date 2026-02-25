import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Leaf, RotateCcw, TrendingUp } from 'lucide-react';
import './Results.css';

const Results = ({ result, onReset, isAuthenticated }) => {
  const navigate = useNavigate();
  const { prediction, alternatives, remedies } = result;

  const getConfidenceColor = (confidence) => {
    if (confidence >= 70) return '#10b981';
    if (confidence >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const getConfidenceLabel = (confidence) => {
    if (confidence >= 70) return 'High Confidence';
    if (confidence >= 50) return 'Moderate Confidence';
    return 'Low Confidence';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="results-container"
    >
      <div className="results-header">
        <div className="results-icon">
          <CheckCircle2 />
        </div>
        <h2>Prediction Results</h2>
      </div>

      {/* Main Prediction Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="prediction-card-main"
      >
        <div className="prediction-header-main">
          <div>
            <h3 className="disease-name">{prediction.disease}</h3>
            <p className="disease-category">{prediction.category}</p>
          </div>
          <div className="confidence-container">
            <div 
              className="confidence-badge"
              style={{ 
                backgroundColor: getConfidenceColor(prediction.confidence),
                color: 'white'
              }}
            >
              <TrendingUp size={18} />
              <span>{prediction.confidence}%</span>
            </div>
            <p className="confidence-label">{getConfidenceLabel(prediction.confidence)}</p>
          </div>
        </div>

        <div className="prediction-details">
          <div className="detail-item">
            <strong>Recommended Specialist:</strong>
            <span>{prediction.specialist}</span>
          </div>
        </div>
      </motion.div>

      {/* Alternative Predictions */}
      {alternatives && alternatives.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="alternatives-section"
        >
          <h3>
            <AlertCircle size={20} />
            Alternative Predictions
          </h3>
          <div className="alternatives-list">
            {alternatives.map((alt, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="alternative-item"
              >
                <span className="alt-disease">{alt.disease}</span>
                <span className="alt-confidence">{alt.confidence}%</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Natural Remedies */}
      {remedies && remedies.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="remedies-section"
        >
          <h3>
            <Leaf size={20} />
            Natural Remedies
          </h3>
          <div className="remedies-grid">
            {remedies.map((remedy, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="remedy-card"
              >
                <h4>{remedy.plant_name}</h4>
                <p className="latin-name">{remedy.latin_name}</p>
                
                <div className="remedy-details">
                  <div className="remedy-detail-item">
                    <strong>Parts Used:</strong>
                    <span>{remedy.parts_used}</span>
                  </div>
                  <div className="remedy-detail-item">
                    <strong>Preparation:</strong>
                    <span>{remedy.preparation}</span>
                  </div>
                  <div className="remedy-detail-item">
                    <strong>Action:</strong>
                    <span>{remedy.action}</span>
                  </div>
                  {remedy.cautions && (
                    <div className="remedy-cautions">
                      <strong>⚠️ Cautions:</strong>
                      <p>{remedy.cautions}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {(!remedies || remedies.length === 0) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="no-remedies"
        >
          <p>No natural remedies found for this condition.</p>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="results-actions">
        <motion.button
          onClick={onReset}
          className="reset-button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <RotateCcw size={18} />
          New Prediction
        </motion.button>
        {isAuthenticated && (
          <motion.button
            onClick={() => navigate('/dashboard')}
            className="dashboard-button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            View in Dashboard
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default Results;
