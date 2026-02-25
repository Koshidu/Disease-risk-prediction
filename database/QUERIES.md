# MySQL Database Queries Reference

This document contains useful SQL queries for the Disease Prediction Database.

## 📊 Basic Queries

### View All Predictions
```sql
SELECT * FROM predictions ORDER BY created_at DESC;
```

### View Recent Predictions (Last 10)
```sql
SELECT * FROM predictions ORDER BY created_at DESC LIMIT 10;
```

### Count Total Predictions
```sql
SELECT COUNT(*) as total_predictions FROM predictions;
```

## 🔍 Search Queries

### Find Predictions by Disease
```sql
SELECT * FROM predictions 
WHERE predicted_disease = 'Diabetes' 
ORDER BY confidence_score DESC;
```

### Find Predictions by Age Range
```sql
SELECT * FROM predictions 
WHERE age BETWEEN 30 AND 50 
ORDER BY created_at DESC;
```

### Find High Confidence Predictions
```sql
SELECT * FROM predictions 
WHERE confidence_score >= 80 
ORDER BY confidence_score DESC;
```

### Find Predictions by Date Range
```sql
SELECT * FROM predictions 
WHERE DATE(created_at) BETWEEN '2024-01-01' AND '2024-12-31'
ORDER BY created_at DESC;
```

## 📈 Statistics Queries

### Disease Distribution
```sql
SELECT 
    predicted_disease,
    COUNT(*) as prediction_count,
    AVG(confidence_score) as avg_confidence,
    MIN(confidence_score) as min_confidence,
    MAX(confidence_score) as max_confidence
FROM predictions
GROUP BY predicted_disease
ORDER BY prediction_count DESC;
```

### Daily Prediction Count
```sql
SELECT 
    DATE(created_at) as date,
    COUNT(*) as prediction_count
FROM predictions
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Average Confidence by Disease Category
```sql
SELECT 
    disease_category,
    COUNT(*) as count,
    AVG(confidence_score) as avg_confidence
FROM predictions
GROUP BY disease_category
ORDER BY count DESC;
```

### Most Common Specialist Recommendations
```sql
SELECT 
    specialist,
    COUNT(*) as recommendation_count
FROM predictions
GROUP BY specialist
ORDER BY recommendation_count DESC;
```

## 📅 Time-Based Queries

### Today's Predictions
```sql
SELECT * FROM predictions 
WHERE DATE(created_at) = CURDATE()
ORDER BY created_at DESC;
```

### This Week's Predictions
```sql
SELECT * FROM predictions 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY created_at DESC;
```

### This Month's Predictions
```sql
SELECT * FROM predictions 
WHERE MONTH(created_at) = MONTH(CURDATE())
AND YEAR(created_at) = YEAR(CURDATE())
ORDER BY created_at DESC;
```

### Predictions by Hour
```sql
SELECT 
    HOUR(created_at) as hour,
    COUNT(*) as prediction_count
FROM predictions
GROUP BY HOUR(created_at)
ORDER BY hour;
```

## 🎯 Advanced Analytics

### Top 5 Diseases This Month
```sql
SELECT 
    predicted_disease,
    COUNT(*) as count,
    AVG(confidence_score) as avg_confidence
FROM predictions
WHERE MONTH(created_at) = MONTH(CURDATE())
AND YEAR(created_at) = YEAR(CURDATE())
GROUP BY predicted_disease
ORDER BY count DESC
LIMIT 5;
```

### Confidence Score Distribution
```sql
SELECT 
    CASE 
        WHEN confidence_score >= 80 THEN 'High (80-100)'
        WHEN confidence_score >= 60 THEN 'Medium (60-79)'
        WHEN confidence_score >= 40 THEN 'Low-Medium (40-59)'
        ELSE 'Low (0-39)'
    END as confidence_range,
    COUNT(*) as count
FROM predictions
GROUP BY confidence_range
ORDER BY MIN(confidence_score) DESC;
```

### Age Group Analysis
```sql
SELECT 
    CASE 
        WHEN age < 18 THEN 'Child (<18)'
        WHEN age < 30 THEN 'Young Adult (18-29)'
        WHEN age < 50 THEN 'Adult (30-49)'
        WHEN age < 65 THEN 'Middle-Aged (50-64)'
        ELSE 'Senior (65+)'
    END as age_group,
    COUNT(*) as count,
    AVG(confidence_score) as avg_confidence
FROM predictions
GROUP BY age_group
ORDER BY MIN(age);
```

### Risk Factor Analysis
```sql
SELECT 
    smoking,
    alcohol,
    COUNT(*) as count,
    AVG(confidence_score) as avg_confidence
FROM predictions
GROUP BY smoking, alcohol
ORDER BY count DESC;
```

## 🔄 Using Views

### Daily Prediction Summary
```sql
SELECT * FROM daily_prediction_summary 
WHERE prediction_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
ORDER BY prediction_date DESC;
```

### Disease Distribution View
```sql
SELECT * FROM disease_distribution 
ORDER BY prediction_count DESC;
```

## 🗑️ Maintenance Queries

### Delete Old Predictions (Older than 1 year)
```sql
DELETE FROM predictions 
WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);
```

### Update Statistics Table
```sql
INSERT INTO prediction_statistics (date, total_predictions, avg_confidence, most_common_disease)
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_predictions,
    AVG(confidence_score) as avg_confidence,
    (SELECT predicted_disease 
     FROM predictions p2 
     WHERE DATE(p2.created_at) = DATE(predictions.created_at)
     GROUP BY predicted_disease 
     ORDER BY COUNT(*) DESC 
     LIMIT 1) as most_common_disease
FROM predictions
WHERE DATE(created_at) = CURDATE()
GROUP BY DATE(created_at)
ON DUPLICATE KEY UPDATE
    total_predictions = VALUES(total_predictions),
    avg_confidence = VALUES(avg_confidence),
    most_common_disease = VALUES(most_common_disease);
```

## 📋 Export Queries

### Export All Predictions to CSV
```sql
SELECT * FROM predictions 
INTO OUTFILE '/tmp/predictions_export.csv'
FIELDS TERMINATED BY ',' 
ENCLOSED BY '"'
LINES TERMINATED BY '\n';
```

### Export Statistics
```sql
SELECT 
    DATE(created_at) as date,
    predicted_disease,
    COUNT(*) as count,
    AVG(confidence_score) as avg_confidence
FROM predictions
GROUP BY DATE(created_at), predicted_disease
ORDER BY date DESC, count DESC
INTO OUTFILE '/tmp/statistics_export.csv'
FIELDS TERMINATED BY ',' 
ENCLOSED BY '"'
LINES TERMINATED BY '\n';
```

## 🔐 User Management (if using users table)

### Create User
```sql
INSERT INTO users (email, password_hash, first_name, last_name)
VALUES ('user@example.com', 'hashed_password', 'John', 'Doe');
```

### Link Prediction to User
```sql
INSERT INTO user_predictions (user_id, prediction_id)
VALUES (1, 123);
```

### Get User's Predictions
```sql
SELECT p.* 
FROM predictions p
JOIN user_predictions up ON p.id = up.prediction_id
WHERE up.user_id = 1
ORDER BY p.created_at DESC;
```
