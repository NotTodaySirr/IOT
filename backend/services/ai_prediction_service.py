import os
import joblib
import numpy as np
import pandas as pd

class  AIPredictionService:
    # Class-level variables to hold models and scalers (Lazy Loading)
    _reg_model = None
    _cls_model = None
    _scaler_X = None
    _scaler_y = None
    _label_encoder = None
    
    # Path to models (Relative to this file)
    model_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'ai', 'ai_models')
    
    @classmethod
    def _load_models(cls):
        """
        Loads models and artifacts if not already loaded.
        
        """
        
        if cls._reg_model is None:
            try:
                print(f"Loading AI models from {cls.model_dir}...")
                cls._reg_model = joblib.load(os.path.join(cls.model_dir, 'ecs_deep_regressor.pkl'))
                cls._cls_model = joblib.load(os.path.join(cls.model_dir, 'ecs_deep_classifier.pkl'))
                
                # These are the "Restored Artifacts" we generated with setup_ai.py
                cls._scaler_X = joblib.load(os.path.join(cls.model_dir, 'scaler_X.pkl'))
                cls._scaler_y = joblib.load(os.path.join(cls.model_dir, 'scaler_y_reg.pkl'))
                cls._label_encoder = joblib.load(os.path.join(cls.model_dir, 'label_encoder.pkl'))
                print("AI models loaded successfully.")
            except FileNotFoundError as e:
                print(f"Error loading AI models: {e}")
                # Important: Verify setup_ai.py was run if this fails
                raise RuntimeError("AI models not found. Please run backend\\ai\\training_models\\env_prediction.ipynb to restore artifacts.") from e
            
            
    @classmethod
    def prediction(cls, data):
        """
        Predicts future changes in the environment and recommend action
        
        Args:
            data (dict):{
                'temperature_C': float,
                'humidity_%': float,
                'CO_ppm': float,
                'action': str (e.g. 'normal', 'high_CO_turn_on_Air_Purifier')
            }
            
        """
        
        cls._load_models() # Load models if not already loaded
        
        try: 
            try:
                action_encoded = cls._label_encoder.transform([data['action']])[0]
            except ValueError:
                raise ValueError(f"Action '{data['action']}' not recognized. Valid actions: {cls._label_encoder.classes_}")
                
                # Try defaulting to 'normal' action if unrecognised
                try:
                    action_encoded = cls._label_encoder.transform(['normal'])[0]
                except:
                     action_encoded = 0 # Absolute fallback
                     
            input_features = np.array([[
                data['temperature_C'],
                data['humidity_%'],
                data['CO_ppm'],
                action_encoded
            ]])
            
            # Scale input features (translate into model language) using restored scaler
            input_scaled = cls._scaler_X.transform(input_features)
            
            # Predict using regression model for future environment
            future_env_scaled = cls._reg_model.predict(input_scaled)
            # Inverse scale to get actual values
            future_env = cls._scaler_y.inverse_transform(future_env_scaled) 
            
            # Predict using classification model for recommended action
            recommended_action_encoded = cls._cls_model.predict(input_scaled)[0]
            # Decode the recommended action
            recommended_action = cls._label_encoder.inverse_transform([recommended_action_encoded])[0]
            
            # Return results as dictionary
            return {
                "status": "success",
                "future_environment": {
                    "temperature_C": round(future_env[0][0], 2),
                    "humidity_%": round(future_env[0][1], 2),
                    "CO_ppm": round(future_env[0][2], 2)
                },
                "recommended_action": recommended_action
            }
        except Exception as e:
            print(f"Error during prediction: {e}")
            return {
                "status": "error",
                "message": str(e)
            }
            