import os
import joblib
import numpy as np
import pandas as pd

class AIService:
    # Class-level variables to hold models and scalers (Lazy Loading)
    _reg_model = None
    _cls_model = None
    _scaler_X = None
    _scaler_y = None
    _label_encoder = None
    
    # Path to models (Relative to this file)
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    MODEL_DIR = os.path.join(BASE_DIR, 'ai', 'ai_models')

    @classmethod
    def _load_artifacts(cls):
        """Loads models and artifacts if not already loaded."""
        if cls._reg_model is None:
            try:
                print(f"Loading AI models from {cls.MODEL_DIR}...")
                cls._reg_model = joblib.load(os.path.join(cls.MODEL_DIR, 'ecs_deep_regressor.pkl'))
                cls._cls_model = joblib.load(os.path.join(cls.MODEL_DIR, 'ecs_deep_classifier.pkl'))
                
                # These are the "Restored Artifacts" we generated with setup_ai.py
                cls._scaler_X = joblib.load(os.path.join(cls.MODEL_DIR, 'scaler_X.pkl'))
                cls._scaler_y = joblib.load(os.path.join(cls.MODEL_DIR, 'scaler_y_reg.pkl'))
                cls._label_encoder = joblib.load(os.path.join(cls.MODEL_DIR, 'label_encoder.pkl'))
                print("AI models loaded successfully.")
            except FileNotFoundError as e:
                print(f"Error loading AI models: {e}")
                # Important: Verify setup_ai.py was run if this fails
                raise RuntimeError("AI models not found. Please run backend/ai/setup_ai.py to restore artifacts.") from e

    @classmethod
    def predict(cls, data):
        """
        Predicts future environment and recommended action.
        
        Args:
            data (dict): {
                'temperature_C': float,
                'humidity_%': float,
                'CO_ppm': float,
                'action': str (e.g. 'normal', 'high_temp_turn_on_AC')
            }
        """
        cls._load_artifacts()
        
        try:
            # 1. Prepare Input Data
            # Expected order: ['temperature_C', 'humidity_%', 'CO_ppm', 'action_encoded']
            
            # Encode the categorical action (using our restored dictionary)
            try:
                # Use transform for single item, wrap in list
                action_encoded = cls._label_encoder.transform([data['action']])[0]
            except ValueError:
                # Handle unknown actions safely
                print(f"Warning: Unknown action '{data['action']}'. Defaulting to 'normal'.")
                # Fallback to a known action if possible, or error out. 
                # Ideally 'normal' should exist. 
                try:
                    action_encoded = cls._label_encoder.transform(['normal'])[0]
                except:
                     action_encoded = 0 # Absolute fallback
            
            # Create feature array
            input_features = np.array([[
                data['temperature_C'], 
                data['humidity_%'], 
                data['CO_ppm'], 
                action_encoded
            ]])
            
            # Scale the input (translate to model language)
            X_scaled = cls._scaler_X.transform(input_features)
            
            # 2. Run Predictions
            
            # Regression (Future Environment)
            y_reg_scaled = cls._reg_model.predict(X_scaled)
            # Inverse scale to get real numbers back
            y_reg = cls._scaler_y.inverse_transform(y_reg_scaled)[0]
            
            # Classification (Recommended Action)
            y_cls_idx = cls._cls_model.predict(X_scaled)[0]
            # Decode to get string back
            recommended_action = cls._label_encoder.inverse_transform([y_cls_idx])[0]
            
            # 3. Format Result
            return {
                "status": "success",
                "predicted_environment": {
                    "temperature_C": round(float(y_reg[0]), 2),
                    "humidity_%": round(float(y_reg[1]), 2),
                    "CO_ppm": round(float(y_reg[2]), 2)
                },
                "recommended_action": recommended_action
            }
            
        except Exception as e:
            print(f"Prediction Error: {e}")
            return {
                "status": "error",
                "message": str(e)
            }
