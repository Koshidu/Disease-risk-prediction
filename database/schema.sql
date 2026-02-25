-- Disease Prediction Database Schema
-- MySQL Database Setup Script

-- Create database (run this first if database doesn't exist)
-- CREATE DATABASE IF NOT EXISTS disease_prediction_db;
-- USE disease_prediction_db;

-- Table: predictions
-- Stores all disease prediction records
CREATE TABLE IF NOT EXISTS predictions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    age INT NOT NULL,
    gender VARCHAR(20) NOT NULL,
    ethnicity VARCHAR(50) NOT NULL,
    family_history VARCHAR(10) NOT NULL,
    smoking VARCHAR(20) NOT NULL,
    alcohol VARCHAR(20) NOT NULL,
    diet_habits VARCHAR(50) NOT NULL,
    physical_activity VARCHAR(20) NOT NULL,
    pre_existing_conditions VARCHAR(100) DEFAULT NULL,
    current_medications VARCHAR(100) DEFAULT NULL,
    symptom_cough VARCHAR(10) DEFAULT 'No',
    symptom_fever VARCHAR(10) DEFAULT 'No',
    symptom_chest_pain VARCHAR(10) DEFAULT 'No',
    symptom_fatigue VARCHAR(10) DEFAULT 'No',
    symptom_duration VARCHAR(20) NOT NULL,
    symptom_severity VARCHAR(20) NOT NULL,
    living_area VARCHAR(20) NOT NULL,
    predicted_disease VARCHAR(100) NOT NULL,
    confidence_score DECIMAL(5, 2) NOT NULL,
    specialist VARCHAR(100) NOT NULL,
    disease_category VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_predicted_disease (predicted_disease),
    INDEX idx_created_at (created_at),
    INDEX idx_confidence_score (confidence_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: users (optional - for future user authentication)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) DEFAULT NULL,
    last_name VARCHAR(100) DEFAULT NULL,
    phone VARCHAR(20) DEFAULT NULL,
    date_of_birth DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: user_predictions (links users to their predictions)
CREATE TABLE IF NOT EXISTS user_predictions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    prediction_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (prediction_id) REFERENCES predictions(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_prediction_id (prediction_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: prediction_statistics (for analytics)
CREATE TABLE IF NOT EXISTS prediction_statistics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    total_predictions INT DEFAULT 0,
    avg_confidence DECIMAL(5, 2) DEFAULT 0.00,
    most_common_disease VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_date (date),
    INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- View: daily_prediction_summary
CREATE OR REPLACE VIEW daily_prediction_summary AS
SELECT 
    DATE(created_at) as prediction_date,
    COUNT(*) as total_predictions,
    AVG(confidence_score) as avg_confidence,
    predicted_disease,
    COUNT(*) as disease_count
FROM predictions
GROUP BY DATE(created_at), predicted_disease
ORDER BY prediction_date DESC, disease_count DESC;

-- View: disease_distribution
CREATE OR REPLACE VIEW disease_distribution AS
SELECT 
    predicted_disease,
    COUNT(*) as prediction_count,
    AVG(confidence_score) as avg_confidence,
    MIN(confidence_score) as min_confidence,
    MAX(confidence_score) as max_confidence,
    specialist,
    disease_category
FROM predictions
GROUP BY predicted_disease, specialist, disease_category
ORDER BY prediction_count DESC;

-- Sample queries for reference:

-- Get all predictions from last 7 days
-- SELECT * FROM predictions WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) ORDER BY created_at DESC;

-- Get predictions by disease
-- SELECT * FROM predictions WHERE predicted_disease = 'Diabetes' ORDER BY confidence_score DESC;

-- Get statistics for a specific date
-- SELECT * FROM daily_prediction_summary WHERE prediction_date = CURDATE();

-- Get top 5 most predicted diseases
-- SELECT predicted_disease, COUNT(*) as count FROM predictions GROUP BY predicted_disease ORDER BY count DESC LIMIT 5;

-- Get average confidence by disease category
-- SELECT disease_category, AVG(confidence_score) as avg_confidence FROM predictions GROUP BY disease_category;
