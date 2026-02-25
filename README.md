# AI-Based Disease Risk Prediction & Natural Remedies System

An intelligent web application that predicts disease risk based on patient symptoms and lifestyle factors, and recommends natural remedies.

## Features

- **Disease Risk Prediction**: ML model predicts disease based on:
  - Patient demographics (Age, Gender, Ethnicity)
  - Lifestyle factors (Smoking, Alcohol, Diet, Physical Activity)
  - Symptoms (Cough, Fever, Chest Pain, Fatigue, Duration, Severity)
  - Medical history (Family History, Pre-existing Conditions, Current Medications)
  
- **Natural Remedies Recommendation**: Suggests natural remedies based on predicted disease

- **User Authentication & Profiles**: 
  - Secure user registration and login
  - Personal user profiles with editable information
  - Account management and settings

- **Prediction History**: 
  - Save and view all your predictions
  - Track your health predictions over time
  - Search and filter prediction history

- **Beautiful Modern UI**: 
  - Responsive design that works on all devices
  - Smooth animations and transitions
  - Intuitive user experience
  - Dashboard with statistics and insights

## Project Structure

```
finalyr_disease_proj/
├── health_dataset.csv          # Training dataset
├── remedies.csv                 # Natural remedies database
├── train_model_max.ipynb        # Jupyter notebook for model training (Google Colab)
├── app.py                      # Flask web application
├── backend/                    # Backend API
├── frontend/                   # React frontend
├── templates/                  # HTML templates
├── static/                     # Static files (CSS, JS)
├── models/                     # Trained models (generated)
│   ├── disease_predictor.pkl
│   ├── label_encoders.pkl
│   └── ...
├── database/                   # Database schemas and setup
└── requirements.txt           # Python dependencies
```

## Installation

### Backend Setup

1. Install Python dependencies:
```bash
pip install -r backend/requirements.txt
```

2. Set up MongoDB (or use MongoDB Atlas):
   - Install MongoDB locally, or
   - Create a MongoDB Atlas account and get connection string
   - Create a `.env` file in the `backend/` directory:
   ```
   MONGO_URI=mongodb://localhost:27017/
   DB_NAME=disease_prediction_db
   JWT_SECRET_KEY=your-secret-key-change-in-production
   ```

3. (Optional) Retrain the model using `train_model_max.ipynb` on Google Colab if needed

4. Run the backend API:
```bash
cd backend
python app_api.py
```
The API will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install Node.js dependencies:
```bash
npm install
```

3. Create a `.env` file (optional, defaults are set):
```
REACT_APP_API_URL=http://localhost:5000
```

4. Start the React development server:
```bash
npm start
```
The frontend will run on `http://localhost:3000`

## Usage

### Getting Started

1. **Create an Account**: 
   - Click "Sign Up" to create a new account
   - Fill in your details (email, password, name)
   - You'll be automatically logged in

2. **Make a Prediction**:
   - Fill in the patient information form
   - Select symptoms and their characteristics
   - Click "Predict Disease Risk"
   - View predicted disease, specialist recommendation, and natural remedies
   - Your prediction will be automatically saved to your account

3. **View Your Dashboard**:
   - Access your dashboard to see all saved predictions
   - View statistics about your predictions
   - Search and filter your prediction history

4. **Manage Your Profile**:
   - Click "Profile" in the dashboard
   - Edit your personal information
   - Update your account details

## Technologies

- **Backend**: 
  - Flask (Python) with RESTful API
  - MongoDB for data storage
  - JWT for authentication
  - Flask-CORS for cross-origin requests

- **Frontend**: 
  - React.js with React Router
  - Framer Motion for animations
  - Axios for API calls
  - Lucide React for icons
  - Modern CSS with CSS Variables

- **ML Model**: 
  - XGBoost, Random Forest, LightGBM with Stacked Ensemble
  - Advanced feature engineering
  - High accuracy predictions

- **Data Processing**: 
  - Pandas, NumPy, scikit-learn
  - Joblib for model serialization

## Important Notes

⚠️ **Medical Disclaimer**: This system is for educational purposes only. Always consult with healthcare professionals for medical advice and treatment.
