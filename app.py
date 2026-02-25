"""
Flask Web Application for Disease Risk Prediction
"""
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import pandas as pd
import joblib
import os
import numpy as np

app = Flask(__name__)
CORS(app)

# Load model and encoders
MODEL_PATH = 'models/disease_predictor.pkl'
ENCODERS_PATH = 'models/label_encoders.pkl'
TARGET_ENCODER_PATH = 'models/target_encoder.pkl'
FEATURE_COLUMNS_PATH = 'models/feature_columns.pkl'

model = None
model_selector = None  # Feature selector if used
label_encoders = None
target_encoder = None
feature_columns = None
selected_features = None  # Selected features if feature selection was used
remedies_df = None

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
                # Single model with selector
                model = loaded_model[0]
                model_selector = loaded_model[1]
            elif len(loaded_model) == 3:
                # Stacked ensemble (models, meta_model, selector)
                models_dict, meta_model, selector = loaded_model
                model = (models_dict, meta_model)  # Store as tuple for prediction
                model_selector = selector
            else:
                model = loaded_model[0]
                model_selector = loaded_model[1] if len(loaded_model) > 1 else None
        else:
            # Old format - single model
            model = loaded_model
            model_selector = None
        
        label_encoders = joblib.load(ENCODERS_PATH)
        target_encoder = joblib.load(TARGET_ENCODER_PATH)
        feature_columns = joblib.load(FEATURE_COLUMNS_PATH)
        
        # Try to load selected features if they exist
        selected_features_path = 'models/selected_features.pkl'
        if os.path.exists(selected_features_path):
            selected_features = joblib.load(selected_features_path)
        else:
            selected_features = None
        # Try different encodings for remedies.csv (handle encoding issues)
        # Use encoding_errors parameter (pandas 2.0+) or fallback to latin-1
        try:
            # Try with encoding_errors (pandas 2.0+)
            remedies_df = pd.read_csv('remedies.csv', encoding='utf-8', encoding_errors='replace')
        except (UnicodeDecodeError, LookupError, TypeError):
            try:
                # Fallback to latin-1 which handles most special characters
                remedies_df = pd.read_csv('remedies.csv', encoding='latin-1')
            except:
                # Last resort: cp1252 (Windows default)
                remedies_df = pd.read_csv('remedies.csv', encoding='cp1252')
        print(f"Loaded {len(remedies_df)} remedies from database")
        return True
    except Exception as e:
        print(f"Error loading model: {e}")
        return False

def get_remedies(disease_name):
    """Get natural remedies for a given disease"""
    if remedies_df is None:
        return []
    
    # Create a mapping dictionary for disease name variations
    disease_mapping = {
        'diabetes': 'Diabetes',
        'heart disease': 'Heart Disease',
        'hypertension': 'Hypertension',
        'influenza': 'Influenza',
        'asthma': 'Asthma',
        'obesity': 'Obesity'
    }
    
    # Normalize disease name
    disease_lower = disease_name.lower().strip()
    
    # Try exact match first
    matching_remedies = remedies_df[
        remedies_df['Condition'].str.lower().str.strip() == disease_lower
    ]
    
    # If no exact match, try partial match
    if matching_remedies.empty:
        matching_remedies = remedies_df[
            remedies_df['Condition'].str.lower().str.contains(disease_lower, na=False, regex=False)
        ]
    
    # If still no match, try mapping
    if matching_remedies.empty and disease_lower in disease_mapping:
        mapped_disease = disease_mapping[disease_lower]
        matching_remedies = remedies_df[
            remedies_df['Condition'] == mapped_disease
        ]
    
    # Debug logging (can be removed in production)
    # print(f"Searching remedies for: '{disease_name}' (normalized: '{disease_lower}')")
    # print(f"Found {len(matching_remedies)} matching remedies")
    
    if matching_remedies.empty:
        # Debug: Show available conditions if no match found
        # if len(remedies_df) > 0:
        #     available = remedies_df['Condition'].unique()
        #     print(f"Available conditions in remedies: {list(available)}")
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
            # print(f"Error processing remedy row: {e}")
            continue
    
    # print(f"Returning {len(remedies_list)} remedies")
    return remedies_list

def create_engineered_features(data, feature_dict, label_encoders):
    """Recreate engineered features as in training"""
    try:
        # Symptom patterns
        symptom_cough = data.get('Symptom_Cough', 'No')
        symptom_fever = data.get('Symptom_Fever', 'No')
        symptom_chest = data.get('Symptom_ChestPain', 'No')
        symptom_fatigue = data.get('Symptom_Fatigue', 'No')
        
        feature_dict['Respiratory_Symptom'] = 1 if (symptom_cough == 'Yes' or symptom_chest == 'Yes') else 0
        feature_dict['Fever_Present'] = 1 if symptom_fever == 'Yes' else 0
        feature_dict['Fatigue_Present'] = 1 if symptom_fatigue == 'Yes' else 0
        feature_dict['Symptom_Count'] = sum([1 if s == 'Yes' else 0 
                                            for s in [symptom_cough, symptom_fever, symptom_chest, symptom_fatigue]])
        
        # Age features
        age = feature_dict.get('Age', 50)
        feature_dict['Age_Squared'] = age ** 2
        feature_dict['Age_Cubed'] = age ** 3
        feature_dict['Is_Senior'] = 1 if age >= 65 else 0
        feature_dict['Is_Child'] = 1 if age < 18 else 0
        feature_dict['Is_Middle_Aged'] = 1 if 40 <= age < 65 else 0
        
        # Age group
        if age < 25:
            age_group = 0
        elif age < 45:
            age_group = 1
        elif age < 65:
            age_group = 2
        else:
            age_group = 3
        feature_dict['Age_Group'] = age_group
        
        # Risk factors
        smoking = data.get('Smoking', 'No')
        alcohol = data.get('Alcohol', 'No')
        family_history = data.get('Family_History', 'No')
        
        feature_dict['Smoking_Risk'] = 1 if smoking in ['Daily', 'Occasional'] else 0
        feature_dict['Alcohol_Risk'] = 1 if alcohol in ['Frequent', 'Social'] else 0
        feature_dict['Family_Risk'] = 1 if family_history == 'Yes' else 0
        feature_dict['Total_Risk_Factors'] = feature_dict['Smoking_Risk'] + feature_dict['Alcohol_Risk'] + feature_dict['Family_Risk']
        feature_dict['High_Risk'] = 1 if feature_dict['Total_Risk_Factors'] >= 2 else 0
        feature_dict['Risk_Squared'] = feature_dict['Total_Risk_Factors'] ** 2
        
        # Lifestyle
        activity_map = {'Low': 0, 'Moderate': 1, 'High': 2}
        diet_map = {'Processed food': 0, 'High sugar': 1, 'Balanced': 2, 'Healthy': 3}
        activity = data.get('Physical_Activity', 'Moderate')
        diet = data.get('Diet_Habits', 'Balanced')
        feature_dict['Activity_Score'] = activity_map.get(activity, 1)
        feature_dict['Diet_Score'] = diet_map.get(diet, 1)
        feature_dict['Lifestyle_Index'] = feature_dict['Activity_Score'] + feature_dict['Diet_Score']
        feature_dict['Unhealthy_Lifestyle'] = 1 if feature_dict['Lifestyle_Index'] <= 2 else 0
        
        # Medical history
        pre_condition = data.get('Pre_existing_Conditions', '')
        medication = data.get('Current_Medications', '')
        feature_dict['Has_PreCondition'] = 1 if pre_condition and pre_condition != '' else 0
        feature_dict['Has_Medication'] = 1 if medication and medication != '' else 0
        
        # Duration and severity
        duration_map = {'1-3 days': 2, '1 week': 7, '2+ weeks': 14, '1+ month': 30}
        severity_map = {'Mild': 1, 'Moderate': 2, 'Severe': 3}
        duration = data.get('Symptom_Duration', '1 week')
        severity = data.get('Symptom_Severity', 'Moderate')
        feature_dict['Duration_Numeric'] = duration_map.get(duration, 7)
        feature_dict['Severity_Numeric'] = severity_map.get(severity, 2)
        feature_dict['Symptom_Intensity'] = feature_dict['Symptom_Count'] * feature_dict['Severity_Numeric']
        feature_dict['Symptom_Count_Squared'] = feature_dict['Symptom_Count'] ** 2
        
        # Disease_Category features (if provided, otherwise infer or use defaults)
        disease_category = data.get('Disease_Category', '')
        if disease_category and disease_category in label_encoders.get('Disease_Category', {}).classes_:
            feature_dict['Is_Respiratory'] = 1 if disease_category == 'Respiratory' else 0
            feature_dict['Is_Cardiac'] = 1 if disease_category == 'Cardiac' else 0
            feature_dict['Is_Metabolic'] = 1 if disease_category == 'Metabolic' else 0
        else:
            # Defaults
            feature_dict['Is_Respiratory'] = 0
            feature_dict['Is_Cardiac'] = 0
            feature_dict['Is_Metabolic'] = 0
        
        # Specialist features (if provided)
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
        
        # Feature interactions
        feature_dict['Respiratory_Symptom_x_Category'] = feature_dict['Respiratory_Symptom'] * feature_dict['Is_Respiratory']
        feature_dict['Age_x_Risk'] = age * feature_dict['Total_Risk_Factors']
        feature_dict['Symptom_x_Severity'] = feature_dict['Symptom_Count'] * feature_dict['Severity_Numeric']
        feature_dict['Category_x_Specialist'] = (feature_dict['Is_Respiratory'] * feature_dict['Is_Pulmonologist'] + 
                                                 feature_dict['Is_Cardiac'] * feature_dict['Is_Cardiologist'] + 
                                                 feature_dict['Is_Metabolic'] * (feature_dict['Is_Endocrinologist'] + feature_dict['Is_Nutritionist']))
        feature_dict['Lifestyle_x_Age'] = feature_dict['Lifestyle_Index'] * age
        feature_dict['PreCondition_x_Medication'] = feature_dict['Has_PreCondition'] * feature_dict['Has_Medication']
        
        # Frequency encoding (simplified)
        ethnicity = data.get('Ethnicity', '')
        if ethnicity and 'Ethnicity' in label_encoders:
            # Use a simple frequency approximation
            feature_dict['Ethnicity_Freq'] = 1  # Default
        else:
            feature_dict['Ethnicity_Freq'] = 1
            
    except Exception as e:
        print(f"Error creating engineered features: {e}")
        # Continue with defaults

def get_disease_info(disease_name):
    """Get additional disease information from dataset"""
    try:
        df = pd.read_csv('health_dataset.csv')
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

@app.route('/')
def index():
    """Render the main page"""
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    """Handle disease prediction request"""
    if model is None:
        return jsonify({
            'error': 'Model not loaded. Please train the model first by running train_model.py'
        }), 500
    
    try:
        # Get input data from request
        data = request.json
        
        # Prepare feature vector - need to create ALL features first, then select if needed
        feature_dict = {}
        
        # Process all original features first
        for col in feature_columns:
            # Skip engineered features - they'll be created by create_engineered_features
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
            
            # Handle numeric columns
            if col == 'Age':
                try:
                    feature_dict[col] = int(value)
                except:
                    feature_dict[col] = 50  # Default age
            else:
                # Encode categorical values
                if col in label_encoders:
                    try:
                        encoded_value = label_encoders[col].transform([str(value)])[0]
                        feature_dict[col] = encoded_value
                    except ValueError:
                        # Use most common value encoding
                        feature_dict[col] = 0
                else:
                    feature_dict[col] = 0
        
        # Create all engineered features
        create_engineered_features(data, feature_dict, label_encoders)
        
        # Create feature vector in the same order as feature_columns
        feature_vector = [feature_dict.get(col, 0) for col in feature_columns]
        feature_array = np.array(feature_vector).reshape(1, -1)
        
        # Apply feature selector if it exists
        if model_selector is not None:
            try:
                feature_array = model_selector.transform(feature_array)
            except:
                # If selector fails, try without it
                pass
        
        # Handle stacked ensemble or single model
        if isinstance(model, tuple) and len(model) == 2:
            # Stacked ensemble: (models_dict, meta_model)
            models_dict, meta_model = model
            # Get predictions from all base models
            meta_features_list = []
            for name, m in models_dict.items():
                try:
                    # Check if it's ExtraTreesClassifier - it might have issues
                    from sklearn.ensemble import ExtraTreesClassifier
                    if isinstance(m, ExtraTreesClassifier):
                        # For ExtraTrees, use predict_proba directly but catch any attribute errors
                        try:
                            proba = m.predict_proba(feature_array)
                            meta_features_list.append(proba)
                        except AttributeError:
                            # Fallback: use predict and create probability distribution
                            pred = m.predict(feature_array)
                            n_classes = len(target_encoder.classes_)
                            proba = np.zeros((1, n_classes))
                            proba[0, pred[0]] = 1.0
                            meta_features_list.append(proba)
                    else:
                        # For other models, use predict_proba normally
                        proba = m.predict_proba(feature_array)
                        meta_features_list.append(proba)
                except Exception as e:
                    # If predict_proba fails, use predict and convert to one-hot
                    print(f"Warning: Model {name} ({type(m).__name__}) predict_proba failed: {e}")
                    try:
                        pred = m.predict(feature_array)
                        n_classes = len(target_encoder.classes_)
                        one_hot = np.zeros((1, n_classes))
                        one_hot[0, pred[0]] = 1.0
                        meta_features_list.append(one_hot)
                    except Exception as e2:
                        print(f"Error with model {name}: {e2}")
                        # Skip this model
                        continue
            
            if meta_features_list:
                meta_features = np.column_stack(meta_features_list)
                prediction_encoded = meta_model.predict(meta_features)[0]
                prediction_proba = meta_model.predict_proba(meta_features)[0]
            else:
                raise ValueError("Failed to get predictions from base models")
        else:
            # Single model - check if it's a tuple (model, selector)
            actual_model = model
            if isinstance(model, tuple):
                actual_model = model[0]
            
            try:
                prediction_encoded = actual_model.predict(feature_array)[0]
                prediction_proba = actual_model.predict_proba(feature_array)[0]
            except AttributeError as e:
                # If model doesn't have predict_proba, use predict only
                prediction_encoded = actual_model.predict(feature_array)[0]
                # Create uniform probability distribution
                n_classes = len(target_encoder.classes_)
                prediction_proba = np.ones(n_classes) / n_classes
                prediction_proba[prediction_encoded] = 0.9  # Give high confidence to prediction
                prediction_proba = prediction_proba / prediction_proba.sum()  # Normalize
        
        # Decode prediction
        disease_name = target_encoder.inverse_transform([prediction_encoded])[0]
        confidence = float(max(prediction_proba)) * 100
        
        # Get disease information
        disease_info = get_disease_info(disease_name)
        
        # Get remedies
        remedies = get_remedies(disease_name)
        
        # Get top 3 alternative predictions
        top_indices = np.argsort(prediction_proba)[-4:-1][::-1]  # Top 3 (excluding the top one)
        alternatives = []
        for idx in top_indices:
            alt_disease = target_encoder.inverse_transform([idx])[0]
            alt_confidence = float(prediction_proba[idx]) * 100
            if alt_confidence > 5:  # Only show if confidence > 5%
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
    
    # Try to read accuracy from file
    accuracy_file = 'models/model_accuracy.txt'
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

if __name__ == '__main__':
    print("Loading model...")
    if load_model():
        print("[OK] Model loaded successfully!")
    else:
        print("[WARNING] Model not found. Please run train_model.py first.")
    
    print("\nStarting Flask server...")
    print("Open http://localhost:5000 in your browser")
    app.run(debug=True, host='0.0.0.0', port=5000)
