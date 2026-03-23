"""
VitalAI - ML Model Training Pipeline
Generates 100k synthetic patient records and trains an ensemble model
"""

import numpy as np
import pandas as pd
import pickle
import json
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score, roc_auc_score
from sklearn.pipeline import Pipeline
import warnings
warnings.filterwarnings('ignore')

np.random.seed(42)
N = 100_000

print("🧬 Generating 100,000 synthetic patient vitals dataset...")

def generate_vitals():
    """Generate realistic vital signs with pathological correlations"""
    
    # Age distribution (20-90)
    age = np.random.normal(50, 18, N).clip(20, 90).astype(int)
    gender = np.random.choice([0, 1], N)  # 0=F, 1=M
    
    # BMI (affecting multiple conditions)
    bmi = np.random.normal(27, 6, N).clip(15, 55)
    
    # Base vitals - healthy ranges
    heart_rate = np.random.normal(72, 12, N).clip(40, 160).astype(int)
    spo2 = np.random.normal(98, 1.5, N).clip(80, 100)
    temperature = np.random.normal(98.6, 0.8, N).clip(95, 107)
    systolic_bp = np.random.normal(120, 18, N).clip(70, 220).astype(int)
    diastolic_bp = np.random.normal(80, 12, N).clip(40, 140).astype(int)
    
    # ECG features
    pr_interval = np.random.normal(160, 20, N).clip(100, 300)  # ms
    qrs_duration = np.random.normal(90, 10, N).clip(60, 200)   # ms
    qt_interval = np.random.normal(400, 35, N).clip(300, 600)   # ms
    st_elevation = np.random.normal(0, 0.5, N).clip(-3, 5)      # mm
    
    # Blood markers
    glucose = np.random.normal(95, 22, N).clip(50, 400)
    cholesterol = np.random.normal(185, 40, N).clip(100, 400)
    
    # Respiratory
    resp_rate = np.random.normal(16, 3, N).clip(8, 40).astype(int)
    
    # Conditions array
    condition = np.full(N, 'Normal', dtype=object)
    risk_score = np.zeros(N)
    
    # --- HYPERTENSION ---
    htn_mask = (systolic_bp > 140) | (diastolic_bp > 90)
    htn_mask &= (age > 35)
    condition[htn_mask] = 'Hypertension'
    risk_score[htn_mask] += 2
    
    # --- BRADYCARDIA ---
    brady_mask = (heart_rate < 50) & (~htn_mask)
    condition[brady_mask] = 'Bradycardia'
    
    # --- TACHYCARDIA ---
    tachy_mask = (heart_rate > 100) & (temperature > 99)
    condition[tachy_mask] = 'Tachycardia'
    
    # --- HYPOXIA ---
    hypox_mask = (spo2 < 94) & (~tachy_mask)
    condition[hypox_mask] = 'Hypoxia'
    risk_score[hypox_mask] += 3
    
    # --- DIABETES ---
    diab_mask = (glucose > 126) & (bmi > 25)
    condition[diab_mask] = 'Diabetes Risk'
    risk_score[diab_mask] += 2
    
    # --- CARDIAC ARRHYTHMIA ---
    arrhyth_mask = ((pr_interval > 200) | (qrs_duration > 120) | (qt_interval > 480))
    arrhyth_mask &= ~diab_mask
    condition[arrhyth_mask] = 'Arrhythmia'
    risk_score[arrhyth_mask] += 4
    
    # --- MYOCARDIAL INFARCTION RISK ---
    mi_mask = (st_elevation > 1.5) & (heart_rate > 90) & (systolic_bp < 100)
    mi_mask &= (age > 45)
    condition[mi_mask] = 'MI Risk'
    risk_score[mi_mask] += 8
    
    # --- FEVER/INFECTION ---
    fever_mask = (temperature > 100.4) & (heart_rate > 90) & (resp_rate > 20)
    fever_mask &= ~mi_mask & ~arrhyth_mask
    condition[fever_mask] = 'Fever/Infection'
    
    # --- HEART FAILURE RISK ---
    hf_mask = (spo2 < 96) & (heart_rate > 95) & (systolic_bp < 110) & (age > 50)
    hf_mask &= ~mi_mask
    condition[hf_mask] = 'Heart Failure Risk'
    risk_score[hf_mask] += 6
    
    # Clamp risk score
    risk_score = risk_score.clip(0, 10)
    
    df = pd.DataFrame({
        'age': age,
        'gender': gender,
        'bmi': bmi.round(1),
        'heart_rate': heart_rate,
        'spo2': spo2.round(1),
        'temperature': temperature.round(1),
        'systolic_bp': systolic_bp,
        'diastolic_bp': diastolic_bp,
        'pr_interval': pr_interval.round(1),
        'qrs_duration': qrs_duration.round(1),
        'qt_interval': qt_interval.round(1),
        'st_elevation': st_elevation.round(2),
        'glucose': glucose.round(1),
        'cholesterol': cholesterol.round(1),
        'resp_rate': resp_rate,
        'risk_score': risk_score.round(1),
        'condition': condition
    })
    
    return df

df = generate_vitals()
print(f"✅ Dataset shape: {df.shape}")
print(f"\n📊 Condition distribution:")
print(df['condition'].value_counts())

# Save dataset sample
df.to_csv('vitals_dataset.csv', index=False)

# Features and target
FEATURES = ['age', 'gender', 'bmi', 'heart_rate', 'spo2', 'temperature',
            'systolic_bp', 'diastolic_bp', 'pr_interval', 'qrs_duration',
            'qt_interval', 'st_elevation', 'glucose', 'cholesterol', 'resp_rate']

X = df[FEATURES]
y = df['condition']

# Encode labels
le = LabelEncoder()
y_enc = le.fit_transform(y)

print(f"\n🎯 Classes: {list(le.classes_)}")

# Train/test split
X_train, X_test, y_train, y_test = train_test_split(X, y_enc, test_size=0.2, stratify=y_enc, random_state=42)

print(f"\n🚀 Training ensemble model on {len(X_train):,} samples...")

# Scaler
scaler = StandardScaler()
X_train_s = scaler.fit_transform(X_train)
X_test_s = scaler.transform(X_test)

# Models
rf = RandomForestClassifier(n_estimators=150, max_depth=15, min_samples_split=5,
                             n_jobs=-1, random_state=42)
gb = GradientBoostingClassifier(n_estimators=100, max_depth=6, learning_rate=0.1,
                                  subsample=0.8, random_state=42)
mlp = MLPClassifier(hidden_layer_sizes=(256, 128, 64), activation='relu',
                     max_iter=200, random_state=42, early_stopping=True)

# Voting ensemble
ensemble = VotingClassifier(estimators=[
    ('rf', rf), ('gb', gb), ('mlp', mlp)
], voting='soft')

ensemble.fit(X_train_s, y_train)

# Evaluate
y_pred = ensemble.predict(X_test_s)
acc = accuracy_score(y_test, y_pred)
print(f"\n✅ Test Accuracy: {acc:.4f} ({acc*100:.2f}%)")
print("\n📋 Classification Report:")
print(classification_report(y_test, y_pred, target_names=le.classes_))

# Feature importance from RF
rf_fitted = ensemble.estimators_[0]
fi = pd.Series(rf_fitted.feature_importances_, index=FEATURES).sort_values(ascending=False)
print("\n🔬 Top Feature Importances:")
print(fi.head(8))

# Save model artifacts
model_artifacts = {
    'ensemble': ensemble,
    'scaler': scaler,
    'label_encoder': le,
    'features': FEATURES,
    'accuracy': acc,
    'classes': list(le.classes_),
    'feature_importance': fi.to_dict()
}

with open('vital_model.pkl', 'wb') as f:
    pickle.dump(model_artifacts, f)

# Save metadata as JSON for frontend
meta = {
    'accuracy': round(acc * 100, 2),
    'classes': list(le.classes_),
    'features': FEATURES,
    'training_samples': len(X_train),
    'feature_importance': fi.round(4).to_dict(),
    'normal_ranges': {
        'heart_rate': {'min': 60, 'max': 100, 'unit': 'bpm'},
        'spo2': {'min': 95, 'max': 100, 'unit': '%'},
        'temperature': {'min': 97.0, 'max': 99.5, 'unit': '°F'},
        'systolic_bp': {'min': 90, 'max': 120, 'unit': 'mmHg'},
        'diastolic_bp': {'min': 60, 'max': 80, 'unit': 'mmHg'},
        'glucose': {'min': 70, 'max': 100, 'unit': 'mg/dL'},
        'resp_rate': {'min': 12, 'max': 20, 'unit': 'br/min'}
    }
}

with open('model_meta.json', 'w') as f:
    json.dump(meta, f, indent=2)

print(f"\n🎉 Model saved! Accuracy: {acc*100:.2f}%")
print("Files: vital_model.pkl, model_meta.json, vitals_dataset.csv")
