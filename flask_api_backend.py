"""
VitalAI - Flask REST API Backend
Serves ML predictions and health analytics
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import pickle
import json
import numpy as np
import pandas as pd
from datetime import datetime
import random
import csv
import os
import sqlite3

app = Flask(__name__)
CORS(app)

def init_db():
    conn = sqlite3.connect('patient_records.db')
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS patient_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            patient_name TEXT,
            age TEXT,
            gender TEXT,
            bmi TEXT,
            heart_rate REAL,
            spo2 REAL,
            temperature REAL,
            systolic_bp REAL,
            diastolic_bp REAL,
            glucose REAL,
            resp_rate REAL,
            cholesterol REAL,
            prediction TEXT,
            confidence REAL,
            risk_score REAL
        )
    ''')
    conn.commit()
    conn.close()
    
    conn = sqlite3.connect('auth_users.db')
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# Load model artifacts
with open('vital_model.pkl', 'rb') as f:
    arts = pickle.load(f)

rf = arts['ensemble']
scaler = arts['scaler']
le = arts['label_encoder']
FEATURES = arts['features']
CLASSES = arts['classes']

with open('model_meta.json') as f:
    META = json.load(f)

# Severity mapping
SEVERITY = {
    'Normal': {'level': 0, 'color': '#00ff88', 'icon': '✅', 'urgency': 'Low'},
    'Hypertension': {'level': 2, 'color': '#ffaa00', 'icon': '⚠️', 'urgency': 'Medium'},
    'Bradycardia': {'level': 2, 'color': '#ffaa00', 'icon': '💛', 'urgency': 'Medium'},
    'Tachycardia': {'level': 2, 'color': '#ffaa00', 'icon': '💓', 'urgency': 'Medium'},
    'Hypoxia': {'level': 3, 'color': '#ff4444', 'icon': '🫁', 'urgency': 'High'},
    'Diabetes Risk': {'level': 2, 'color': '#ffaa00', 'icon': '🩸', 'urgency': 'Medium'},
    'Arrhythmia': {'level': 3, 'color': '#ff4444', 'icon': '💔', 'urgency': 'High'},
    'Fever/Infection': {'level': 2, 'color': '#ffaa00', 'icon': '🌡️', 'urgency': 'Medium'},
    'MI Risk': {'level': 4, 'color': '#ff0000', 'icon': '🚨', 'urgency': 'Critical'},
    'Heart Failure Risk': {'level': 4, 'color': '#ff0000', 'icon': '🚑', 'urgency': 'Critical'},
}

RECOMMENDATIONS = {
    'Normal': ['Maintain regular exercise routine', 'Continue balanced diet', 'Annual checkup recommended', 'Stay hydrated'],
    'Hypertension': ['Reduce sodium intake (<2300mg/day)', 'Daily 30-min moderate exercise', 'Monitor BP twice daily', 'Consult cardiologist', 'Reduce stress levels'],
    'Bradycardia': ['Avoid excessive caffeine', 'Monitor for dizziness/fainting', 'Cardiology evaluation needed', 'ECG monitoring advised'],
    'Tachycardia': ['Rest immediately', 'Avoid stimulants', 'Stay well hydrated', 'Seek medical attention if persistent'],
    'Hypoxia': ['⚠️ Seek immediate medical attention', 'Check respiratory status', 'Supplemental O₂ may be needed', 'Pulse oximetry monitoring'],
    'Diabetes Risk': ['Reduce refined carbohydrates', 'HbA1c test recommended', 'Weight management program', 'Fasting glucose test needed'],
    'Arrhythmia': ['Holter monitor evaluation', 'Avoid caffeine & alcohol', 'Electrolyte panel blood test', 'Electrophysiology referral'],
    'Fever/Infection': ['Rest and increase fluid intake', 'Monitor temperature every 4h', 'Antipyretics if >101°F', 'Seek care if >103°F or >3 days'],
    'MI Risk': ['🚨 CALL EMERGENCY SERVICES NOW', 'Do not drive yourself', 'Chew aspirin if not allergic', 'Stay calm and sit/lie down'],
    'Heart Failure Risk': ['🚑 Urgent cardiology consult', 'Daily weight monitoring', 'Fluid restriction may apply', 'Restrict physical activity'],
}

def get_abnormal_vitals(data):
    """Identify which vitals are out of normal range"""
    alerts = []
    nr = META['normal_ranges']
    
    checks = [
        ('heart_rate', data.get('heart_rate'), 'Heart Rate'),
        ('spo2', data.get('spo2'), 'SpO₂'),
        ('temperature', data.get('temperature'), 'Temperature'),
        ('systolic_bp', data.get('systolic_bp'), 'Systolic BP'),
        ('diastolic_bp', data.get('diastolic_bp'), 'Diastolic BP'),
        ('glucose', data.get('glucose'), 'Glucose'),
        ('resp_rate', data.get('resp_rate'), 'Resp Rate'),
    ]
    
    for key, val, label in checks:
        if val is None or key not in nr:
            continue
        r = nr[key]
        if val < r['min']:
            alerts.append({'vital': label, 'value': val, 'unit': r['unit'], 'status': 'LOW', 'normal': f"{r['min']}-{r['max']}"})
        elif val > r['max']:
            alerts.append({'vital': label, 'value': val, 'unit': r['unit'], 'status': 'HIGH', 'normal': f"{r['min']}-{r['max']}"})
    
    return alerts


@app.route('/')
def serve_dashboard():
    return send_file('vitalai_dashboard.html')

@app.route('/api/predict', methods=['POST'])
def predict():
    data = request.json
    
    # Build feature vector
    feat_vec = [data.get(f, 0) for f in FEATURES]
    X = np.array(feat_vec).reshape(1, -1)
    X_scaled = scaler.transform(X)
    
    # Predictions
    proba = rf.predict_proba(X_scaled)[0]
    pred_idx = np.argmax(proba)
    prediction = le.inverse_transform([pred_idx])[0]
    confidence = float(proba[pred_idx]) * 100
    
    # Top 3 predictions
    top3_idx = np.argsort(proba)[::-1][:3]
    top3 = [
        {'condition': le.inverse_transform([i])[0], 'probability': round(float(proba[i]) * 100, 1)}
        for i in top3_idx
    ]
    
    sev = SEVERITY.get(prediction, SEVERITY['Normal'])
    recs = RECOMMENDATIONS.get(prediction, RECOMMENDATIONS['Normal'])
    alerts = get_abnormal_vitals(data)
    
    # Compute vitals risk score (0-100)
    risk_factors = 0
    if data.get('systolic_bp', 120) > 140: risk_factors += 20
    if data.get('spo2', 98) < 94: risk_factors += 25
    if data.get('heart_rate', 72) > 100 or data.get('heart_rate', 72) < 50: risk_factors += 15
    if data.get('temperature', 98.6) > 100.4: risk_factors += 10
    if data.get('glucose', 90) > 126: risk_factors += 15
    if data.get('qt_interval', 400) > 480: risk_factors += 15
    
    return jsonify({
        'prediction': prediction,
        'confidence': round(confidence, 1),
        'severity': sev,
        'top_predictions': top3,
        'recommendations': recs,
        'abnormal_vitals': alerts,
        'risk_score': min(risk_factors + (sev['level'] * 8), 100),
        'timestamp': datetime.now().isoformat(),
        'model_accuracy': META['accuracy']
    })


@app.route('/api/trends', methods=['POST'])
def trends():
    """Generate simulated historical trend data for the patient"""
    data = request.json
    hr = data.get('heart_rate', 72)
    spo2 = data.get('spo2', 98)
    bp = data.get('systolic_bp', 120)
    temp = data.get('temperature', 98.6)
    
    hours = list(range(-23, 1))
    def gen_trend(base, noise, hours):
        return [round(base + random.gauss(0, noise) + 0.3 * np.sin(i * 0.3), 1) for i in range(len(hours))]
    
    return jsonify({
        'labels': [f"{abs(h)}h ago" if h < 0 else "Now" for h in hours],
        'heart_rate': gen_trend(hr, 4, hours),
        'spo2': gen_trend(spo2, 0.5, hours),
        'systolic_bp': gen_trend(bp, 6, hours),
        'temperature': gen_trend(temp, 0.3, hours),
    })


@app.route('/api/ecg', methods=['POST'])
def ecg_simulate():
    """Simulate ECG waveform based on patient params"""
    data = request.json
    hr = data.get('heart_rate', 72)
    qt = data.get('qt_interval', 400)
    st = data.get('st_elevation', 0)
    
    # Generate synthetic ECG-like waveform
    t = np.linspace(0, 3, 900)
    period = 60.0 / hr
    
    ecg = np.zeros(len(t))
    for beat_start in np.arange(0, 3, period):
        beat_t = t - beat_start
        mask = (beat_t >= 0) & (beat_t < period)
        bt = beat_t[mask]
        # P wave
        p = 0.15 * np.exp(-((bt - 0.08) ** 2) / 0.001)
        # QRS
        q = -0.1 * np.exp(-((bt - 0.16) ** 2) / 0.0002)
        r = 1.2 * np.exp(-((bt - 0.18) ** 2) / 0.0001)
        s = -0.2 * np.exp(-((bt - 0.21) ** 2) / 0.0002)
        # T wave with ST elevation
        t_wave = (0.35 + st * 0.1) * np.exp(-((bt - (0.18 + qt/1000 * 0.8)) ** 2) / 0.003)
        ecg[mask] = p + q + r + s + t_wave
    
    noise = np.random.normal(0, 0.015, len(ecg))
    ecg += noise
    
    return jsonify({
        'time': t.round(3).tolist(),
        'amplitude': ecg.round(4).tolist(),
        'heart_rate': hr,
        'abnormal': qt > 480 or st > 1.5
    })


@app.route('/api/meta', methods=['GET'])
def meta():
    return jsonify(META)


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'model': 'VitalAI v1.0', 'accuracy': META['accuracy']})

@app.route('/login')
def serve_login():
    return send_file('auth.html')

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({'status': 'error', 'message': 'Username and password required'}), 400
    try:
        conn = sqlite3.connect('auth_users.db')
        c = conn.cursor()
        c.execute('INSERT INTO users (username, password) VALUES (?, ?)', (username, password))
        conn.commit()
    except sqlite3.IntegrityError:
        if 'conn' in locals(): conn.close()
        return jsonify({'status': 'error', 'message': 'Username already exists, please login'}), 400
    except Exception as e:
        if 'conn' in locals(): conn.close()
        return jsonify({'status': 'error', 'message': str(e)}), 500
    finally:
        if 'conn' in locals(): conn.close()
    return jsonify({'status': 'success'})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    try:
        conn = sqlite3.connect('auth_users.db')
        c = conn.cursor()
        c.execute('SELECT * FROM users WHERE username = ? AND password = ?', (username, password))
        user = c.fetchone()
    except Exception as e:
        if 'conn' in locals(): conn.close()
        return jsonify({'status': 'error', 'message': str(e)}), 500
    finally:
        if 'conn' in locals(): conn.close()
        
    if user:
        return jsonify({'status': 'success'})
    else:
        return jsonify({'status': 'error', 'message': 'User unavailable, please sign up.'}), 401

@app.route('/api/save_record', methods=['POST'])
def save_record():
    data = request.json
    try:
        conn = sqlite3.connect('patient_records.db')
        c = conn.cursor()
        c.execute('''
            INSERT INTO patient_records (
                timestamp, patient_name, age, gender, bmi, heart_rate, spo2, 
                temperature, systolic_bp, diastolic_bp, glucose, resp_rate, 
                cholesterol, prediction, confidence, risk_score
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('timestamp', datetime.now().isoformat()),
            str(data.get('patient_name', 'Unknown')),
            str(data.get('age', '')),
            str(data.get('gender', '')),
            str(data.get('bmi', '')),
            float(data.get('heart_rate', 0)),
            float(data.get('spo2', 0)),
            float(data.get('temperature', 0)),
            float(data.get('systolic_bp', 0)),
            float(data.get('diastolic_bp', 0)),
            float(data.get('glucose', 0)),
            float(data.get('resp_rate', 0)),
            float(data.get('cholesterol', 0)),
            str(data.get('prediction', 'Unknown')),
            float(data.get('confidence', 0)),
            float(data.get('risk_score', 0))
        ))
        conn.commit()
        conn.close()
        
        # Also keep CSV for legacy compatibility temporarily
        file_exists = os.path.isfile('patient_records.csv')
        with open('patient_records.csv', mode='a', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=data.keys())
            if not file_exists:
                writer.writeheader()
            writer.writerow(data)
            
        return jsonify({'status': 'success'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/history', methods=['GET'])
def get_history():
    try:
        conn = sqlite3.connect('patient_records.db')
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute('SELECT * FROM patient_records ORDER BY id ASC LIMIT 200')
        rows = c.fetchall()
        conn.close()
        return jsonify([dict(ix) for ix in rows])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/shutdown', methods=['POST'])
def shutdown():
    import os, signal, threading
    def kill_server():
        os.kill(os.getpid(), signal.SIGTERM)
    # Allows response to send successfully before killing script
    threading.Timer(0.5, kill_server).start()
    return jsonify({'status': 'success', 'message': 'Shutting down...'})

if __name__ == '__main__':
    import webbrowser, threading
    print(f"[START] VitalAI API running | Model accuracy: {META['accuracy']}%")
    print(f"[INFO] Open dashboard at: http://127.0.0.1:5050")
    threading.Timer(1.5, lambda: webbrowser.open('http://127.0.0.1:5050')).start()
    app.run(debug=False, port=5050, use_reloader=False)
