from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import pandas as pd
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Load all models and preprocessor
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models')

# Target variables mapping (user-friendly names to model names)
TARGET_MAPPING = {
    'toilet_paper_sheets': 'Total_Toilet_Paper_Sheets',
    'hand_soap_mL': 'Hand soap (mL)',
    'disinfectant_mL': 'Disinfectant (mL)',
    'air_freshener_mL': 'Air freshener (mL)',
    'glass_cleaner_mL': 'Glass cleaner (mL)',
    'trash_bags_8gallon': 'Trash_Bags (8 gallon)',
    'nonbathroom_tissue_sheets': 'Total_Tissues',
    'number_of_workers': 'Number_of_Workers'
}

# Load preprocessor
try:
    preprocessor = joblib.load(os.path.join(MODEL_DIR, 'preprocessor.joblib'))
    print("✅ Preprocessor loaded successfully")
except Exception as e:
    print(f"❌ Error loading preprocessor: {e}")
    preprocessor = None

# Load all prediction models
models = {}
for target_key in TARGET_MAPPING.keys():
    model_path = os.path.join(MODEL_DIR, f'et_model_{target_key}.joblib')
    try:
        models[target_key] = joblib.load(model_path)
        print(f"✅ Model loaded: {target_key}")
    except Exception as e:
        print(f"❌ Error loading model {target_key}: {e}")

# Organization types for one-hot encoding (must match training data exactly)
ORG_TYPES = [
    'Banks', 'Clinics', 'Gyms', 'Hospitals', 'Hotels', 
    'Libraries', 'Restaurants', 'Retail Stores', 'Schools', 
    'Shopping Malls', 'Storage Facilities', 'Warehouses', 
    'college', 'company'
]

# Cleaning frequency mapping (must match training data encoding)
# From notebook: Low=0, Medium=1, High=2
CLEANING_FREQUENCY_MAP = {
    'Low': 0,
    'Medium': 1,
    'High': 2
}

def prepare_input_features(data):
    """
    Prepare input features for prediction
    
    Expected input format:
    {
        "facility_size_sqm": 1000,
        "number_of_people": 50,
        "number_of_bathrooms": 10,
        "days_count": 30,
        "cleaning_frequency": "Daily",  # or numeric value
        "organization_type": "Hotels"
    }
    """
    # Extract base features
    facility_size = float(data.get('facility_size_sqm', 0))
    num_people = float(data.get('number_of_people', 0))
    num_bathrooms = float(data.get('number_of_bathrooms', 0))
    days_count = float(data.get('days_count', 30))
    
    # Handle cleaning frequency
    cleaning_freq = data.get('cleaning_frequency', 'Medium')
    if isinstance(cleaning_freq, str):
        cleaning_freq_encoded = CLEANING_FREQUENCY_MAP.get(cleaning_freq, 1)  # Default to Medium=1
    else:
        cleaning_freq_encoded = float(cleaning_freq)
    
    # Get organization type
    org_type = data.get('organization_type', 'company')
    
    # Create base features dictionary
    features = {
        'facility_size_sqm': facility_size,
        'number_of_people': num_people,
        'number_of_bathrooms': num_bathrooms,
        'days_count': days_count,
        'cleaning_frequency_encoded': cleaning_freq_encoded
    }
    
    # Add one-hot encoded organization types
    for org in ORG_TYPES:
        features[f'Org_{org}'] = 1.0 if org == org_type else 0.0
    
    # Convert to DataFrame
    df = pd.DataFrame([features])
    
    # Ensure column order matches training data
    expected_columns = ['facility_size_sqm', 'number_of_people', 'number_of_bathrooms',
                       'days_count', 'cleaning_frequency_encoded'] + \
                       [f'Org_{org}' for org in ORG_TYPES]
    
    df = df[expected_columns]
    
    return df

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'OK',
        'message': 'Daqeeq ML API is running',
        'models_loaded': len(models),
        'preprocessor_loaded': preprocessor is not None
    }), 200

@app.route('/predict', methods=['POST'])
def predict():
    """
    Main prediction endpoint
    
    Request body:
    {
        "facility_size_sqm": 1000,
        "number_of_people": 50,
        "number_of_bathrooms": 10,
        "days_count": 30,
        "cleaning_frequency": "Daily",
        "organization_type": "Hotels"
    }
    
    Response:
    {
        "predictions": {
            "Total_Toilet_Paper_Sheets": 12345.67,
            "Hand soap (mL)": 1234.56,
            ...
        },
        "input_features": {...}
    }
    """
    try:
        # Get request data
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No input data provided'}), 400
        
        # Validate required fields
        required_fields = ['facility_size_sqm', 'number_of_people', 
                          'number_of_bathrooms', 'organization_type']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            return jsonify({
                'error': 'Missing required fields',
                'missing_fields': missing_fields
            }), 400
        
        # Prepare features
        input_features = prepare_input_features(data)
        
        # Debug: Print feature info
        print(f"📊 Input features shape: {input_features.shape}")
        print(f"📋 Input features columns ({len(input_features.columns)}): {list(input_features.columns)}")
        
        # Transform features using preprocessor
        if preprocessor:
            # Check if preprocessor has feature_names_in_
            if hasattr(preprocessor, 'feature_names_in_'):
                print(f"🎯 Preprocessor expects ({len(preprocessor.feature_names_in_)}): {list(preprocessor.feature_names_in_)}")
            
            input_scaled = preprocessor.transform(input_features)
            # Convert back to DataFrame with proper column names
            scaled_columns = list(input_features.columns)
            input_scaled_df = pd.DataFrame(input_scaled, columns=scaled_columns)
        else:
            input_scaled_df = input_features
        
        # Make predictions for all targets
        predictions = {}
        for target_key, display_name in TARGET_MAPPING.items():
            if target_key in models:
                pred_value = models[target_key].predict(input_scaled_df)[0]
                # Ensure non-negative predictions
                pred_value = max(0, pred_value)
                predictions[display_name] = round(float(pred_value), 2)
        
        return jsonify({
            'success': True,
            'predictions': predictions,
            'input_features': data
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Prediction failed',
            'message': str(e)
        }), 500

@app.route('/predict/<target>', methods=['POST'])
def predict_single(target):
    """
    Predict a single target variable
    
    URL parameter: target (e.g., 'toilet_paper_sheets')
    Request body: Same as /predict endpoint
    """
    try:
        if target not in models:
            return jsonify({
                'error': 'Invalid target variable',
                'valid_targets': list(TARGET_MAPPING.keys())
            }), 400
        
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No input data provided'}), 400
        
        # Prepare features
        input_features = prepare_input_features(data)
        
        # Transform features
        if preprocessor:
            input_scaled = preprocessor.transform(input_features)
            scaled_columns = list(input_features.columns)
            input_scaled_df = pd.DataFrame(input_scaled, columns=scaled_columns)
        else:
            input_scaled_df = input_features
        
        # Make prediction
        pred_value = models[target].predict(input_scaled_df)[0]
        pred_value = max(0, pred_value)
        
        return jsonify({
            'success': True,
            'target': TARGET_MAPPING[target],
            'prediction': round(float(pred_value), 2),
            'input_features': data
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Prediction failed',
            'message': str(e)
        }), 500

@app.route('/models/info', methods=['GET'])
def models_info():
    """Get information about available models"""
    return jsonify({
        'available_models': list(TARGET_MAPPING.values()),
        'organization_types': ORG_TYPES,
        'cleaning_frequencies': list(CLEANING_FREQUENCY_MAP.keys()),
        'input_fields': {
            'required': [
                'facility_size_sqm',
                'number_of_people',
                'number_of_bathrooms',
                'organization_type'
            ],
            'optional': [
                'days_count',  # default: 30
                'cleaning_frequency'  # default: 'Daily'
            ]
        }
    }), 200

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5001))
    debug = os.getenv('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)