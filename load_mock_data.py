import sqlite3
import random
from datetime import datetime, timedelta

def generate_mock_data():
    conn = sqlite3.connect('patient_records.db')
    c = conn.cursor()

    mock_patients = [
        {"name": "Alice Wonderland", "age": 28, "gender": "Female", "prediction": "Normal", "hr": 65, "spo2": 99, "temp": 98.4, "sys": 115, "dia": 75, "gluc": 88, "resp": 14, "chol": 160, "risk": 4, "conf": 99.2},
        {"name": "Bruce Wayne", "age": 45, "gender": "Male", "prediction": "Tachycardia", "hr": 125, "spo2": 97, "temp": 98.6, "sys": 135, "dia": 85, "gluc": 95, "resp": 22, "chol": 180, "risk": 35, "conf": 94.1},
        {"name": "Clark Kent", "age": 35, "gender": "Male", "prediction": "Normal", "hr": 55, "spo2": 100, "temp": 98.6, "sys": 120, "dia": 80, "gluc": 90, "resp": 12, "chol": 150, "risk": 2, "conf": 99.8},
        {"name": "Diana Prince", "age": 32, "gender": "Female", "prediction": "Bradycardia", "hr": 48, "spo2": 98, "temp": 98.5, "sys": 110, "dia": 70, "gluc": 92, "resp": 14, "chol": 165, "risk": 40, "conf": 91.5},
        {"name": "Peter Parker", "age": 22, "gender": "Male", "prediction": "Fever/Infection", "hr": 105, "spo2": 96, "temp": 103.1, "sys": 125, "dia": 82, "gluc": 100, "resp": 24, "chol": 155, "risk": 55, "conf": 96.3},
        {"name": "Tony Stark", "age": 52, "gender": "Male", "prediction": "Arrhythmia", "hr": 140, "spo2": 95, "temp": 98.8, "sys": 150, "dia": 95, "gluc": 110, "resp": 20, "chol": 210, "risk": 75, "conf": 89.9},
        {"name": "Natasha Romanoff", "age": 38, "gender": "Female", "prediction": "Normal", "hr": 70, "spo2": 99, "temp": 98.6, "sys": 118, "dia": 78, "gluc": 85, "resp": 16, "chol": 175, "risk": 5, "conf": 98.5},
        {"name": "Steve Rogers", "age": 105, "gender": "Male", "prediction": "Normal", "hr": 60, "spo2": 100, "temp": 98.6, "sys": 120, "dia": 80, "gluc": 90, "resp": 14, "chol": 160, "risk": 3, "conf": 99.4},
        {"name": "Wanda Maximoff", "age": 30, "gender": "Female", "prediction": "Hypertension", "hr": 85, "spo2": 98, "temp": 98.7, "sys": 160, "dia": 100, "gluc": 95, "resp": 18, "chol": 190, "risk": 60, "conf": 95.2},
        {"name": "Stephen Strange", "age": 45, "gender": "Male", "prediction": "Hypoxia", "hr": 110, "spo2": 85, "temp": 99.2, "sys": 130, "dia": 85, "gluc": 105, "resp": 28, "chol": 195, "risk": 85, "conf": 97.4},
        {"name": "Carol Danvers", "age": 35, "gender": "Female", "prediction": "Normal", "hr": 68, "spo2": 99, "temp": 98.6, "sys": 115, "dia": 75, "gluc": 88, "resp": 15, "chol": 170, "risk": 4, "conf": 99.1},
        {"name": "Arthur Curry", "age": 40, "gender": "Male", "prediction": "Bradycardia", "hr": 45, "spo2": 98, "temp": 98.2, "sys": 110, "dia": 70, "gluc": 92, "resp": 12, "chol": 180, "risk": 45, "conf": 90.8},
        {"name": "Barry Allen", "age": 28, "gender": "Male", "prediction": "Tachycardia", "hr": 160, "spo2": 98, "temp": 99.5, "sys": 140, "dia": 90, "gluc": 115, "resp": 26, "chol": 165, "risk": 65, "conf": 98.1},
        {"name": "Hal Jordan", "age": 35, "gender": "Male", "prediction": "Normal", "hr": 72, "spo2": 99, "temp": 98.6, "sys": 122, "dia": 80, "gluc": 95, "resp": 16, "chol": 185, "risk": 5, "conf": 98.9},
        {"name": "Victor Stone", "age": 25, "gender": "Male", "prediction": "Arrhythmia", "hr": 115, "spo2": 96, "temp": 98.9, "sys": 135, "dia": 85, "gluc": 100, "resp": 20, "chol": 175, "risk": 55, "conf": 87.6},
        {"name": "Oliver Queen", "age": 38, "gender": "Male", "prediction": "Hypertension", "hr": 80, "spo2": 97, "temp": 98.5, "sys": 155, "dia": 95, "gluc": 105, "resp": 18, "chol": 205, "risk": 50, "conf": 93.4},
        {"name": "John Diggle", "age": 42, "gender": "Male", "prediction": "Normal", "hr": 65, "spo2": 98, "temp": 98.4, "sys": 118, "dia": 78, "gluc": 90, "resp": 14, "chol": 190, "risk": 4, "conf": 99.3},
        {"name": "Felicity Smoak", "age": 30, "gender": "Female", "prediction": "Normal", "hr": 70, "spo2": 99, "temp": 98.6, "sys": 112, "dia": 72, "gluc": 85, "resp": 16, "chol": 165, "risk": 3, "conf": 99.6},
        {"name": "Roy Harper", "age": 25, "gender": "Male", "prediction": "Tachycardia", "hr": 135, "spo2": 97, "temp": 98.8, "sys": 130, "dia": 85, "gluc": 100, "resp": 22, "chol": 170, "risk": 45, "conf": 92.7},
        {"name": "Thea Queen", "age": 22, "gender": "Female", "prediction": "Normal", "hr": 68, "spo2": 99, "temp": 98.5, "sys": 110, "dia": 70, "gluc": 88, "resp": 15, "chol": 155, "risk": 2, "conf": 99.5}
    ]

    for i, p in enumerate(mock_patients):
        ts = (datetime.now() - timedelta(days=random.randint(0, 30), hours=random.randint(0, 24))).isoformat()
        bmi = round(random.uniform(20.0, 35.0), 1)
        
        c.execute('''
            INSERT INTO patient_records (
                timestamp, patient_name, age, gender, bmi, heart_rate, spo2, 
                temperature, systolic_bp, diastolic_bp, glucose, resp_rate, 
                cholesterol, prediction, confidence, risk_score
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            ts, p["name"], p["age"], p["gender"], bmi, p["hr"], p["spo2"],
            p["temp"], p["sys"], p["dia"], p["gluc"], p["resp"],
            p["chol"], p["prediction"], p["conf"], p["risk"]
        ))
        
    conn.commit()
    conn.close()
    print(f"Successfully loaded {len(mock_patients)} MORE mock patients into patient_records.db")

if __name__ == '__main__':
    generate_mock_data()
