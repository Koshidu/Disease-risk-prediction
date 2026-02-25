"""
Flask API Backend for Disease Risk Prediction with MongoDB Integration
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import pandas as pd
import joblib
import os
import numpy as np
from datetime import datetime, timedelta
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, OperationFailure, DuplicateKeyError
from bson import ObjectId
from dotenv import load_dotenv
import json
import bcrypt
import re

# Load environment variables
load_dotenv()

app = Flask(__name__)

# CORS Configuration - Allow React frontend
CORS(app, 
     resources={
         r"/api/*": {
             "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
             "allow_headers": ["Content-Type", "Authorization"],
             "supports_credentials": True
         },
         r"/*": {
             "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
             "allow_headers": ["Content-Type", "Authorization"],
             "supports_credentials": True
         }
     })

# JWT Configuration
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)
app.config['JWT_TOKEN_LOCATION'] = ['headers']
app.config['JWT_HEADER_NAME'] = 'Authorization'
app.config['JWT_HEADER_TYPE'] = 'Bearer'
jwt = JWTManager(app)

# Global CORS handler
@app.after_request
def after_request(response):
    origin = request.headers.get('Origin')
    if origin in ['http://localhost:3000', 'http://127.0.0.1:3000']:
        response.headers.add('Access-Control-Allow-Origin', origin)
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

# MongoDB configuration
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
DB_NAME = os.getenv('DB_NAME', 'disease_prediction_db')

# MongoDB client and database
mongo_client = None
db = None

# Model paths (relative to project root, not backend directory)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, 'models', 'disease_predictor.pkl')
ENCODERS_PATH = os.path.join(BASE_DIR, 'models', 'label_encoders.pkl')
TARGET_ENCODER_PATH = os.path.join(BASE_DIR, 'models', 'target_encoder.pkl')
FEATURE_COLUMNS_PATH = os.path.join(BASE_DIR, 'models', 'feature_columns.pkl')

# Global variables
model = None
model_selector = None
label_encoders = None
target_encoder = None
feature_columns = None
selected_features = None
remedies_df = None

def get_db_connection():
    """Initialize and return MongoDB database connection"""
    global mongo_client, db
    try:
        if mongo_client is None:
            mongo_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
            # Test connection
            mongo_client.server_info()
            db = mongo_client[DB_NAME]
            print(f"✅ Connected to MongoDB: {DB_NAME}")
        return db
    except ConnectionFailure as e:
        print(f"Error connecting to MongoDB: {e}")
        return None
    except Exception as e:
        print(f"Error initializing MongoDB: {e}")
        return None

def load_model():
    """Load the trained model and encoders"""
    global model, model_selector, label_encoders, target_encoder, feature_columns, selected_features, remedies_df
    
    if not os.path.exists(MODEL_PATH):
        return False
    
    try:
        loaded_model = joblib.load(MODEL_PATH)
        
        # Handle tuple format (model, selector) or (models, meta_model, selector)
        if isinstance(loaded_model, tuple):
            if len(loaded_model) == 2:
                model = loaded_model[0]
                model_selector = loaded_model[1]
            elif len(loaded_model) == 3:
                models_dict, meta_model, selector = loaded_model
                model = (models_dict, meta_model)
                model_selector = selector
            else:
                model = loaded_model[0]
                model_selector = loaded_model[1] if len(loaded_model) > 1 else None
        else:
            model = loaded_model
            model_selector = None
        
        label_encoders = joblib.load(ENCODERS_PATH)
        target_encoder = joblib.load(TARGET_ENCODER_PATH)
        feature_columns = joblib.load(FEATURE_COLUMNS_PATH)
        
        selected_features_path = os.path.join(BASE_DIR, 'models', 'selected_features.pkl')
        if os.path.exists(selected_features_path):
            selected_features = joblib.load(selected_features_path)
        else:
            selected_features = None
        
        # Load remedies
        remedies_path = os.path.join(BASE_DIR, 'remedies.csv')
        try:
            remedies_df = pd.read_csv(remedies_path, encoding='utf-8', encoding_errors='replace')
        except (UnicodeDecodeError, LookupError, TypeError):
            try:
                remedies_df = pd.read_csv(remedies_path, encoding='latin-1')
            except:
                remedies_df = pd.read_csv(remedies_path, encoding='cp1252')
        
        print(f"Loaded {len(remedies_df)} remedies from database")
        return True
    except Exception as e:
        print(f"Error loading model: {e}")
        return False

def get_remedies(disease_name):
    """Get natural remedies for a given disease"""
    if remedies_df is None:
        return []
    
    disease_mapping = {
        'diabetes': 'Diabetes',
        'heart disease': 'Heart Disease',
        'hypertension': 'Hypertension',
        'influenza': 'Influenza',
        'asthma': 'Asthma',
        'obesity': 'Obesity'
    }
    
    disease_lower = disease_name.lower().strip()
    
    matching_remedies = remedies_df[
        remedies_df['Condition'].str.lower().str.strip() == disease_lower
    ]
    
    if matching_remedies.empty:
        matching_remedies = remedies_df[
            remedies_df['Condition'].str.lower().str.contains(disease_lower, na=False, regex=False)
        ]
    
    if matching_remedies.empty and disease_lower in disease_mapping:
        mapped_disease = disease_mapping[disease_lower]
        matching_remedies = remedies_df[
            remedies_df['Condition'] == mapped_disease
        ]
    
    if matching_remedies.empty:
        return []
    
    remedies_list = []
    for _, row in matching_remedies.iterrows():
        try:
            remedy = {
                'plant_name': str(row['Plant Name (Common)']) if pd.notna(row['Plant Name (Common)']) else 'Unknown',
                'latin_name': str(row['Plant Name (Latin)']) if pd.notna(row['Plant Name (Latin)']) else 'Unknown',
                'parts_used': str(row['Key Parts Used']) if pd.notna(row['Key Parts Used']) else 'N/A',
                'preparation': str(row['Preparation & Use']) if pd.notna(row['Preparation & Use']) else 'N/A',
                'action': str(row['Key Action/Claim']) if pd.notna(row['Key Action/Claim']) else 'N/A',
                'cautions': str(row['Important Cautions']) if pd.notna(row['Important Cautions']) else ''
            }
            remedies_list.append(remedy)
        except Exception as e:
            continue
    
    return remedies_list

def create_engineered_features(data, feature_dict, label_encoders):
    """Recreate engineered features as in training"""
    try:
        symptom_cough = data.get('Symptom_Cough', 'No')
        symptom_fever = data.get('Symptom_Fever', 'No')
        symptom_chest = data.get('Symptom_ChestPain', 'No')
        symptom_fatigue = data.get('Symptom_Fatigue', 'No')
        
        feature_dict['Respiratory_Symptom'] = 1 if (symptom_cough == 'Yes' or symptom_chest == 'Yes') else 0
        feature_dict['Fever_Present'] = 1 if symptom_fever == 'Yes' else 0
        feature_dict['Fatigue_Present'] = 1 if symptom_fatigue == 'Yes' else 0
        feature_dict['Symptom_Count'] = sum([1 if s == 'Yes' else 0 
                                            for s in [symptom_cough, symptom_fever, symptom_chest, symptom_fatigue]])
        
        age = feature_dict.get('Age', 50)
        feature_dict['Age_Squared'] = age ** 2
        feature_dict['Age_Cubed'] = age ** 3
        feature_dict['Is_Senior'] = 1 if age >= 65 else 0
        feature_dict['Is_Child'] = 1 if age < 18 else 0
        feature_dict['Is_Middle_Aged'] = 1 if 40 <= age < 65 else 0
        
        if age < 25:
            age_group = 0
        elif age < 45:
            age_group = 1
        elif age < 65:
            age_group = 2
        else:
            age_group = 3
        feature_dict['Age_Group'] = age_group
        
        smoking = data.get('Smoking', 'No')
        alcohol = data.get('Alcohol', 'No')
        family_history = data.get('Family_History', 'No')
        
        feature_dict['Smoking_Risk'] = 1 if smoking in ['Daily', 'Occasional'] else 0
        feature_dict['Alcohol_Risk'] = 1 if alcohol in ['Frequent', 'Social'] else 0
        feature_dict['Family_Risk'] = 1 if family_history == 'Yes' else 0
        feature_dict['Total_Risk_Factors'] = feature_dict['Smoking_Risk'] + feature_dict['Alcohol_Risk'] + feature_dict['Family_Risk']
        feature_dict['High_Risk'] = 1 if feature_dict['Total_Risk_Factors'] >= 2 else 0
        feature_dict['Risk_Squared'] = feature_dict['Total_Risk_Factors'] ** 2
        
        activity_map = {'Low': 0, 'Moderate': 1, 'High': 2}
        diet_map = {'Processed food': 0, 'High sugar': 1, 'Balanced': 2, 'Healthy': 3}
        activity = data.get('Physical_Activity', 'Moderate')
        diet = data.get('Diet_Habits', 'Balanced')
        feature_dict['Activity_Score'] = activity_map.get(activity, 1)
        feature_dict['Diet_Score'] = diet_map.get(diet, 1)
        feature_dict['Lifestyle_Index'] = feature_dict['Activity_Score'] + feature_dict['Diet_Score']
        feature_dict['Unhealthy_Lifestyle'] = 1 if feature_dict['Lifestyle_Index'] <= 2 else 0
        
        pre_condition = data.get('Pre_existing_Conditions', '')
        medication = data.get('Current_Medications', '')
        feature_dict['Has_PreCondition'] = 1 if pre_condition and pre_condition != '' else 0
        feature_dict['Has_Medication'] = 1 if medication and medication != '' else 0
        
        duration_map = {'1-3 days': 2, '1 week': 7, '2+ weeks': 14, '1+ month': 30}
        severity_map = {'Mild': 1, 'Moderate': 2, 'Severe': 3}
        duration = data.get('Symptom_Duration', '1 week')
        severity = data.get('Symptom_Severity', 'Moderate')
        feature_dict['Duration_Numeric'] = duration_map.get(duration, 7)
        feature_dict['Severity_Numeric'] = severity_map.get(severity, 2)
        feature_dict['Symptom_Intensity'] = feature_dict['Symptom_Count'] * feature_dict['Severity_Numeric']
        feature_dict['Symptom_Count_Squared'] = feature_dict['Symptom_Count'] ** 2
        
        disease_category = data.get('Disease_Category', '')
        if disease_category and disease_category in label_encoders.get('Disease_Category', {}).classes_:
            feature_dict['Is_Respiratory'] = 1 if disease_category == 'Respiratory' else 0
            feature_dict['Is_Cardiac'] = 1 if disease_category == 'Cardiac' else 0
            feature_dict['Is_Metabolic'] = 1 if disease_category == 'Metabolic' else 0
        else:
            feature_dict['Is_Respiratory'] = 0
            feature_dict['Is_Cardiac'] = 0
            feature_dict['Is_Metabolic'] = 0
        
        specialist = data.get('Specialist', '')
        if specialist:
            feature_dict['Is_Cardiologist'] = 1 if specialist == 'Cardiologist' else 0
            feature_dict['Is_Endocrinologist'] = 1 if specialist == 'Endocrinologist' else 0
            feature_dict['Is_Pulmonologist'] = 1 if specialist == 'Pulmonologist' else 0
            feature_dict['Is_GP'] = 1 if specialist == 'General Practitioner' else 0
            feature_dict['Is_Nutritionist'] = 1 if specialist == 'Nutritionist' else 0
        else:
            feature_dict['Is_Cardiologist'] = 0
            feature_dict['Is_Endocrinologist'] = 0
            feature_dict['Is_Pulmonologist'] = 0
            feature_dict['Is_GP'] = 0
            feature_dict['Is_Nutritionist'] = 0
        
        feature_dict['Respiratory_Symptom_x_Category'] = feature_dict['Respiratory_Symptom'] * feature_dict['Is_Respiratory']
        feature_dict['Age_x_Risk'] = age * feature_dict['Total_Risk_Factors']
        feature_dict['Symptom_x_Severity'] = feature_dict['Symptom_Count'] * feature_dict['Severity_Numeric']
        feature_dict['Category_x_Specialist'] = (feature_dict['Is_Respiratory'] * feature_dict['Is_Pulmonologist'] + 
                                                 feature_dict['Is_Cardiac'] * feature_dict['Is_Cardiologist'] + 
                                                 feature_dict['Is_Metabolic'] * (feature_dict['Is_Endocrinologist'] + feature_dict['Is_Nutritionist']))
        feature_dict['Lifestyle_x_Age'] = feature_dict['Lifestyle_Index'] * age
        feature_dict['PreCondition_x_Medication'] = feature_dict['Has_PreCondition'] * feature_dict['Has_Medication']
        
        ethnicity = data.get('Ethnicity', '')
        if ethnicity and 'Ethnicity' in label_encoders:
            feature_dict['Ethnicity_Freq'] = 1
        else:
            feature_dict['Ethnicity_Freq'] = 1
            
    except Exception as e:
        print(f"Error creating engineered features: {e}")

def get_disease_info(disease_name):
    """Get additional disease information from dataset"""
    try:
        health_dataset_path = os.path.join(BASE_DIR, 'health_dataset.csv')
        df = pd.read_csv(health_dataset_path)
        disease_data = df[df['Disease'] == disease_name].iloc[0]
        
        return {
            'specialist': disease_data.get('Specialist', 'General Practitioner'),
            'category': disease_data.get('Disease_Category', 'General')
        }
    except:
        return {
            'specialist': 'General Practitioner',
            'category': 'General'
        }

@app.route('/', methods=['GET'])
def root():
    """Root endpoint - API information"""
    return jsonify({
        'message': 'Disease Prediction API',
        'version': '1.0.0',
        'status': 'running',
        'endpoints': {
            'health': '/health',
            'model_info': '/model-info',
            'predict': '/predict (POST)',
            'register': '/api/register (POST)',
            'login': '/api/login (POST)',
            'profile': '/api/profile (PUT)',
            'my_predictions': '/api/my-predictions (GET)',
            'save_prediction': '/api/save-prediction (POST)'
        },
        'model_loaded': model is not None
    })

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None
    })

@app.route('/model-info', methods=['GET'])
def model_info():
    """Get model information including accuracy"""
    if model is None:
        return jsonify({
            'error': 'Model not loaded'
        }), 404
    
    info = {
        'model_loaded': True,
        'model_type': 'Random Forest Classifier',
        'feature_count': len(feature_columns) if feature_columns else 0,
        'disease_classes': list(target_encoder.classes_) if target_encoder else []
    }
    
    accuracy_file = os.path.join(BASE_DIR, 'models', 'model_accuracy.txt')
    if os.path.exists(accuracy_file):
        try:
            with open(accuracy_file, 'r') as f:
                lines = f.readlines()
                for line in lines:
                    if 'Model Accuracy:' in line:
                        accuracy_str = line.split(':')[1].strip().replace('%', '')
                        info['accuracy'] = float(accuracy_str)
                        break
        except:
            pass
    
    return jsonify(info)

@app.route('/predict', methods=['POST'])
def predict():
    """Handle disease prediction request"""
    if model is None:
        return jsonify({
            'error': 'Model not loaded. Please train the model first by running train_model.py'
        }), 500
    
    try:
        data = request.json
        
        feature_dict = {}
        
        for col in feature_columns:
            if any(col.startswith(prefix) for prefix in ['Symptom_Count', 'Has_', 'Is_', 'Risk_', 'Age_', 
                                                         'Duration_', 'Severity_', 'Activity_', 'Diet_', 
                                                         'Lifestyle_', 'Respiratory_', 'Fever_', 'Fatigue_',
                                                         'Total_', 'Symptom_Intensity', 'Unhealthy_', 
                                                         'Risk_Squared', 'Symptom_Count_Squared', 
                                                         'Lifestyle_x_', 'Age_x_', 'Symptom_x_', 
                                                         'Category_x_', 'PreCondition_x_', 'Age_Squared',
                                                         'Age_Cubed', 'Age_Group', 'Duration_Numeric',
                                                         'Severity_Numeric', 'Lifestyle_Index', 'TargetEnc',
                                                         'Freq', 'Ethnicity_Freq']):
                continue
                
            value = data.get(col, 'Unknown')
            
            if col == 'Age':
                try:
                    feature_dict[col] = int(value)
                except:
                    feature_dict[col] = 50
            else:
                if col in label_encoders:
                    try:
                        encoded_value = label_encoders[col].transform([str(value)])[0]
                        feature_dict[col] = encoded_value
                    except ValueError:
                        feature_dict[col] = 0
                else:
                    feature_dict[col] = 0
        
        create_engineered_features(data, feature_dict, label_encoders)
        
        feature_vector = [feature_dict.get(col, 0) for col in feature_columns]
        feature_array = np.array(feature_vector).reshape(1, -1)
        
        if model_selector is not None:
            try:
                feature_array = model_selector.transform(feature_array)
            except:
                pass
        
        if isinstance(model, tuple) and len(model) == 2:
            models_dict, meta_model = model
            meta_features_list = []
            for name, m in models_dict.items():
                try:
                    from sklearn.ensemble import ExtraTreesClassifier
                    if isinstance(m, ExtraTreesClassifier):
                        try:
                            proba = m.predict_proba(feature_array)
                            meta_features_list.append(proba)
                        except AttributeError:
                            pred = m.predict(feature_array)
                            n_classes = len(target_encoder.classes_)
                            proba = np.zeros((1, n_classes))
                            proba[0, pred[0]] = 1.0
                            meta_features_list.append(proba)
                    else:
                        proba = m.predict_proba(feature_array)
                        meta_features_list.append(proba)
                except Exception as e:
                    print(f"Warning: Model {name} predict_proba failed: {e}")
                    try:
                        pred = m.predict(feature_array)
                        n_classes = len(target_encoder.classes_)
                        one_hot = np.zeros((1, n_classes))
                        one_hot[0, pred[0]] = 1.0
                        meta_features_list.append(one_hot)
                    except Exception as e2:
                        print(f"Error with model {name}: {e2}")
                        continue
            
            if meta_features_list:
                meta_features = np.column_stack(meta_features_list)
                prediction_encoded = meta_model.predict(meta_features)[0]
                prediction_proba = meta_model.predict_proba(meta_features)[0]
            else:
                raise ValueError("Failed to get predictions from base models")
        else:
            actual_model = model
            if isinstance(model, tuple):
                actual_model = model[0]
            
            try:
                prediction_encoded = actual_model.predict(feature_array)[0]
                prediction_proba = actual_model.predict_proba(feature_array)[0]
            except AttributeError as e:
                prediction_encoded = actual_model.predict(feature_array)[0]
                n_classes = len(target_encoder.classes_)
                prediction_proba = np.ones(n_classes) / n_classes
                prediction_proba[prediction_encoded] = 0.9
                prediction_proba = prediction_proba / prediction_proba.sum()
        
        disease_name = target_encoder.inverse_transform([prediction_encoded])[0]
        confidence = float(max(prediction_proba)) * 100
        
        disease_info = get_disease_info(disease_name)
        remedies = get_remedies(disease_name)
        
        top_indices = np.argsort(prediction_proba)[-4:-1][::-1]
        alternatives = []
        for idx in top_indices:
            alt_disease = target_encoder.inverse_transform([idx])[0]
            alt_confidence = float(prediction_proba[idx]) * 100
            if alt_confidence > 5:
                alternatives.append({
                    'disease': alt_disease,
                    'confidence': round(alt_confidence, 2)
                })
        
        return jsonify({
            'success': True,
            'prediction': {
                'disease': disease_name,
                'confidence': round(confidence, 2),
                'specialist': disease_info['specialist'],
                'category': disease_info['category']
            },
            'alternatives': alternatives,
            'remedies': remedies
        })
    
    except Exception as e:
        return jsonify({
            'error': f'Prediction error: {str(e)}'
        }), 500

# ==================== AUTHENTICATION ENDPOINTS ====================

@app.route('/api/register', methods=['POST', 'OPTIONS'])
def register():
    """User registration endpoint"""
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    
    db = get_db_connection()
    if db is None:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        if not request.json:
            return jsonify({'error': 'No data provided'}), 400
            
        data = request.json
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        first_name = data.get('first_name', '').strip()
        last_name = data.get('last_name', '').strip()
        
        # Validation
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        
        # Check if user exists
        if db.users.find_one({'email': email}):
            return jsonify({'error': 'Email already registered'}), 400
        
        # Hash password
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Create user
        user_doc = {
            'email': email,
            'password_hash': password_hash,
            'first_name': first_name,
            'last_name': last_name,
            'created_at': datetime.now(),
            'updated_at': datetime.now(),
            'last_login': None,
            'is_active': True
        }
        
        result = db.users.insert_one(user_doc)
        user_id = str(result.inserted_id)
        
        # Create access token
        access_token = create_access_token(identity=user_id)
        
        response = jsonify({
            'success': True,
            'message': 'User registered successfully',
            'user': {
                'id': user_id,
                'email': email,
                'first_name': first_name,
                'last_name': last_name
            },
            'access_token': access_token
        })
        response.status_code = 201
        return response
    
    except DuplicateKeyError:
        return jsonify({'error': 'Email already registered'}), 400
    except Exception as e:
        print(f"Registration error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Registration error: {str(e)}'}), 500

@app.route('/api/login', methods=['POST', 'OPTIONS'])
def login():
    """User login endpoint"""
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    
    db = get_db_connection()
    if db is None:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        data = request.json
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Find user
        user = db.users.find_one({'email': email})
        if not user:
            return jsonify({'error': 'Invalid email or password'}), 401
        
        if not user.get('is_active', True):
            return jsonify({'error': 'Account is deactivated'}), 403
        
        # Verify password
        if not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Update last login
        db.users.update_one(
            {'_id': user['_id']},
            {'$set': {'last_login': datetime.now()}}
        )
        
        # Create access token
        access_token = create_access_token(identity=str(user['_id']))
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'user': {
                'id': str(user['_id']),
                'email': user['email'],
                'first_name': user.get('first_name'),
                'last_name': user.get('last_name')
            },
            'access_token': access_token
        })
    
    except Exception as e:
        print(f"Login error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Login error: {str(e)}'}), 500

@app.route('/api/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current authenticated user"""
    db = get_db_connection()
    if db is None:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        user_id = get_jwt_identity()
        user = db.users.find_one({'_id': ObjectId(user_id)})
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'success': True,
            'user': {
                'id': str(user['_id']),
                'email': user['email'],
                'first_name': user.get('first_name'),
                'last_name': user.get('last_name'),
                'phone': user.get('phone'),
                'date_of_birth': user.get('date_of_birth').isoformat() if user.get('date_of_birth') else None,
                'created_at': user.get('created_at').isoformat() if user.get('created_at') else None,
                'last_login': user.get('last_login').isoformat() if user.get('last_login') else None
            }
        })
    
    except Exception as e:
        return jsonify({'error': f'Error fetching user: {str(e)}'}), 500

@app.route('/api/profile', methods=['PUT', 'OPTIONS'])
@jwt_required()
def update_profile():
    """Update user profile"""
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    
    db = get_db_connection()
    if db is None:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        user_id = get_jwt_identity()
        data = request.json
        
        # Prepare update fields
        update_fields = {}
        if 'first_name' in data:
            update_fields['first_name'] = data['first_name'].strip()
        if 'last_name' in data:
            update_fields['last_name'] = data['last_name'].strip()
        if 'phone' in data:
            update_fields['phone'] = data['phone'].strip()
        if 'date_of_birth' in data and data['date_of_birth']:
            try:
                update_fields['date_of_birth'] = datetime.fromisoformat(data['date_of_birth'].replace('Z', '+00:00'))
            except:
                pass
        
        update_fields['updated_at'] = datetime.now()
        
        # Update user
        result = db.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': update_fields}
        )
        
        if result.matched_count == 0:
            return jsonify({'error': 'User not found'}), 404
        
        # Fetch updated user
        user = db.users.find_one({'_id': ObjectId(user_id)})
        
        return jsonify({
            'success': True,
            'message': 'Profile updated successfully',
            'user': {
                'id': str(user['_id']),
                'email': user['email'],
                'first_name': user.get('first_name'),
                'last_name': user.get('last_name'),
                'phone': user.get('phone'),
                'date_of_birth': user.get('date_of_birth').isoformat() if user.get('date_of_birth') else None,
                'created_at': user.get('created_at').isoformat() if user.get('created_at') else None,
                'last_login': user.get('last_login').isoformat() if user.get('last_login') else None
            }
        })
    
    except Exception as e:
        print(f"Profile update error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Error updating profile: {str(e)}'}), 500

@app.route('/api/my-predictions', methods=['GET'])
@jwt_required()
def get_my_predictions():
    """Get current user's predictions"""
    db = get_db_connection()
    if db is None:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify({'error': 'User not authenticated'}), 401
        
        limit = int(request.args.get('limit', 50))
        
        # Convert user_id to ObjectId
        try:
            user_object_id = ObjectId(user_id)
        except Exception as e:
            print(f"Invalid user_id format: {user_id}, error: {e}")
            return jsonify({'error': 'Invalid user ID format'}), 400
        
        # Get user's prediction IDs
        user_predictions = list(
            db.user_predictions.find({'user_id': user_object_id})
            .sort('created_at', -1)
            .limit(limit)
        )
        
        prediction_ids = [pred['prediction_id'] for pred in user_predictions]
        
        if not prediction_ids:
            return jsonify({
                'success': True,
                'predictions': [],
                'count': 0,
                'message': 'No predictions found'
            })
        
        # Get predictions
        predictions = list(
            db.predictions.find({'_id': {'$in': prediction_ids}})
            .sort('created_at', -1)
        )
        
        # Convert ObjectId and datetime
        for pred in predictions:
            pred['_id'] = str(pred['_id'])
            if 'created_at' in pred and isinstance(pred['created_at'], datetime):
                pred['created_at'] = pred['created_at'].isoformat()
            if 'updated_at' in pred and isinstance(pred['updated_at'], datetime):
                pred['updated_at'] = pred['updated_at'].isoformat()
        
        return jsonify({
            'success': True,
            'predictions': predictions,
            'count': len(predictions)
        })
    
    except Exception as e:
        print(f"Error in get_my_predictions: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Error fetching predictions: {str(e)}'}), 500

# ==================== PREDICTION ENDPOINTS ====================

@app.route('/api/save-prediction', methods=['POST', 'OPTIONS'])
@jwt_required(optional=True)
def save_prediction():
    """Save prediction data to MongoDB database"""
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    
    db = get_db_connection()
    if db is None:
        return jsonify({
            'error': 'Database connection failed'
        }), 500
    
    try:
        data = request.json
        prediction_data = data.get('prediction', {})
        
        # Prepare document for MongoDB
        prediction_doc = {
            'age': data.get('Age'),
            'gender': data.get('Gender'),
            'ethnicity': data.get('Ethnicity'),
            'family_history': data.get('Family_History'),
            'smoking': data.get('Smoking'),
            'alcohol': data.get('Alcohol'),
            'diet_habits': data.get('Diet_Habits'),
            'physical_activity': data.get('Physical_Activity'),
            'pre_existing_conditions': data.get('Pre_existing_Conditions') or None,
            'current_medications': data.get('Current_Medications') or None,
            'symptom_cough': data.get('Symptom_Cough', 'No'),
            'symptom_fever': data.get('Symptom_Fever', 'No'),
            'symptom_chest_pain': data.get('Symptom_ChestPain', 'No'),
            'symptom_fatigue': data.get('Symptom_Fatigue', 'No'),
            'symptom_duration': data.get('Symptom_Duration'),
            'symptom_severity': data.get('Symptom_Severity'),
            'living_area': data.get('Living_Area'),
            'predicted_disease': prediction_data.get('disease'),
            'confidence_score': float(prediction_data.get('confidence', 0)),
            'specialist': prediction_data.get('specialist'),
            'disease_category': prediction_data.get('category'),
            'created_at': datetime.now(),
            'updated_at': datetime.now()
        }
        
        # Insert into predictions collection
        result = db.predictions.insert_one(prediction_doc)
        prediction_id = result.inserted_id
        
        # Link to user if authenticated
        try:
            user_id = get_jwt_identity()
            if user_id:
                try:
                    user_object_id = ObjectId(user_id)
                    db.user_predictions.insert_one({
                        'user_id': user_object_id,
                        'prediction_id': prediction_id,
                        'created_at': datetime.now()
                    })
                    print(f"✅ Linked prediction {prediction_id} to user {user_id}")
                except Exception as link_error:
                    print(f"⚠️ Error linking prediction to user: {link_error}")
        except Exception as e:
            print(f"⚠️ Could not get user identity: {e}")
            # Continue even if user linking fails
        
        return jsonify({
            'success': True,
            'message': 'Prediction saved successfully',
            'prediction_id': str(prediction_id)
        })
    
    except OperationFailure as e:
        return jsonify({
            'error': f'MongoDB operation error: {str(e)}'
        }), 500
    except Exception as e:
        return jsonify({
            'error': f'Error saving prediction: {str(e)}'
        }), 500

@app.route('/api/predictions', methods=['GET'])
def get_predictions():
    """Get all predictions from MongoDB database"""
    db = get_db_connection()
    if db is None:
        return jsonify({
            'error': 'Database connection failed'
        }), 500
    
    try:
        # Get query parameters
        limit = int(request.args.get('limit', 100))
        disease = request.args.get('disease', None)
        
        # Build query
        query = {}
        if disease:
            query['predicted_disease'] = disease
        
        # Fetch predictions
        predictions = list(
            db.predictions.find(query)
            .sort('created_at', -1)
            .limit(limit)
        )
        
        # Convert ObjectId to string for JSON serialization
        for pred in predictions:
            pred['_id'] = str(pred['_id'])
            # Convert datetime to ISO format string
            if 'created_at' in pred and isinstance(pred['created_at'], datetime):
                pred['created_at'] = pred['created_at'].isoformat()
            if 'updated_at' in pred and isinstance(pred['updated_at'], datetime):
                pred['updated_at'] = pred['updated_at'].isoformat()
        
        return jsonify({
            'success': True,
            'predictions': predictions,
            'count': len(predictions)
        })
    
    except OperationFailure as e:
        return jsonify({
            'error': f'MongoDB operation error: {str(e)}'
        }), 500
    except Exception as e:
        return jsonify({
            'error': f'Error fetching predictions: {str(e)}'
        }), 500

@app.route('/api/predictions/<prediction_id>', methods=['DELETE', 'OPTIONS'])
@jwt_required()
def delete_prediction(prediction_id):
    """Delete a prediction (only if it belongs to the current user)"""
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    
    db = get_db_connection()
    if db is None:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify({'error': 'User not authenticated'}), 401
        
        # Convert IDs to ObjectId
        try:
            user_object_id = ObjectId(user_id)
            prediction_object_id = ObjectId(prediction_id)
        except Exception as e:
            return jsonify({'error': 'Invalid ID format'}), 400
        
        # Check if the prediction belongs to the user
        user_prediction = db.user_predictions.find_one({
            'user_id': user_object_id,
            'prediction_id': prediction_object_id
        })
        
        if not user_prediction:
            return jsonify({'error': 'Prediction not found or access denied'}), 404
        
        # Delete the user_prediction link
        db.user_predictions.delete_one({
            'user_id': user_object_id,
            'prediction_id': prediction_object_id
        })
        
        # Check if any other users have this prediction
        other_users = db.user_predictions.find_one({
            'prediction_id': prediction_object_id
        })
        
        # Only delete the prediction itself if no other users have it
        # (In this case, we'll delete it anyway since each user should have their own)
        # But for safety, we can keep the prediction and just remove the link
        # For now, let's delete the prediction as well
        db.predictions.delete_one({'_id': prediction_object_id})
        
        return jsonify({
            'success': True,
            'message': 'Prediction deleted successfully'
        })
    
    except Exception as e:
        print(f"Error deleting prediction: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Error deleting prediction: {str(e)}'}), 500

if __name__ == '__main__':
    print("Loading model...")
    if load_model():
        print("✅ Model loaded successfully!")
    else:
        print("⚠️  Model not found. Please run train_model.py first.")
    
    # Initialize MongoDB connection
    print("\nConnecting to MongoDB...")
    get_db_connection()
    
    print("\nStarting Flask API server...")
    print("API available at http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
