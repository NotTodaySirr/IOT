import os
import pandas as pd
import joblib
from sklearn.preprocessing import StandardScaler, LabelEncoder

# ==================================================================================
# AI SETUP & RESTORATION SCRIPT
# ==================================================================================
# REASON FOR THIS SCRIPT:
# The original AI models (.pkl files) were saved without their accompanying 
# "translation dictionaries" (Scalers and Encoders). Without these, the models 
# cannot understand the input data (Temperature, Humidity, etc.) or produce 
# readable output (Action names).
#
# THIS SCRIPT DOES THE FOLLOWING:
# 1. Loads the original training data.
# 2. Re-calculates the Scalers (for normalizing numbers) and Encoders (for names).
# 3. Saves these generic helper files so the backend can use the AI models.
# 4. IT DOES NOT MODIFY THE AI "BRAIN" (The Neural Network weights).
# ==================================================================================

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, 'data', 'environmental_data.csv')
MODEL_DIR = os.path.join(BASE_DIR, 'ai_models')

def setup_ai_artifacts():
    print("Starting AI Artifact Restoration...")
    
    # 1. Load Data
    if not os.path.exists(DATA_PATH):
        print(f"ERROR: Data file not found at {DATA_PATH}")
        return

    print(f"Loading data from {DATA_PATH}...")
    df = pd.read_csv(DATA_PATH)
    
    # Process timestamps (standard procedure from training notebook)
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df = df.sort_values('timestamp')
    
    # 2. Feature Engineering (Must match training notebook EXACTLY)
    future_steps = 5 
    features = ['temperature_C', 'humidity_%', 'CO_ppm']
    
    # Create Lagged Targets (needed to drop NaNs correctly to match training set)
    for feat in features:
        df[f'target_{feat}'] = df[feat].shift(-future_steps)
    df['target_action'] = df['action'].shift(-future_steps)
    
    # Drop NaNs - This ensures we fit on the exact same data distribution
    df_clean = df.dropna()

    # 3. Re-create Label Encoder (The Dictionary for Actions)
    print("Restoring Label Encoder...")
    le = LabelEncoder()
    # Fit on ALL actions (current and future) to ensure we know all words
    all_actions = pd.concat([df_clean['action'], df_clean['target_action']])
    le.fit(all_actions)
    
    # 4. Re-create Scalers (The Dictionary for Numbers)
    print("Restoring Feature Scalers...")
    
    # Inputs (X)
    # Note: We need to encode action first to match X structure
    # X structure in training was: [temp, humid, co, action_encoded]
    df_clean['action_encoded'] = le.transform(df_clean['action'])
    X = df_clean[features + ['action_encoded']].values
    
    scaler_X = StandardScaler()
    scaler_X.fit(X)
    
    # Outputs (Y Regression)
    # y_reg structure: [target_temp, target_humid, target_co]
    y_reg = df_clean[[f'target_{feat}' for feat in features]].values
    
    scaler_y_reg = StandardScaler()
    scaler_y_reg.fit(y_reg)

    # 5. Save Everything
    if not os.path.exists(MODEL_DIR):
        os.makedirs(MODEL_DIR)
        
    print(f"Saving artifacts to {MODEL_DIR}...")
    
    # Save the restored artifacts
    joblib.dump(le, os.path.join(MODEL_DIR, 'label_encoder.pkl'))
    joblib.dump(scaler_X, os.path.join(MODEL_DIR, 'scaler_X.pkl'))
    joblib.dump(scaler_y_reg, os.path.join(MODEL_DIR, 'scaler_y_reg.pkl'))
    
    print("SUCCESS: AI artifacts restored! The backend can now 'speak' to the models.")

if __name__ == "__main__":
    setup_ai_artifacts()
