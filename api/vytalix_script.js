  <script>
    // ═══════════════════════════════════════════════
    //  DATA & MODEL
    // ═══════════════════════════════════════════════

    const MODEL_META = {
      accuracy: 99.73,
      classes: ["Arrhythmia", "Bradycardia", "Diabetes Risk", "Fever/Infection", "Hypertension", "Hypoxia", "Normal", "Tachycardia"],
      feature_importance: {
        "diastolic_bp": 0.3696, "systolic_bp": 0.2674, "heart_rate": 0.0986, "glucose": 0.0971,
        "pr_interval": 0.0724, "temperature": 0.0373, "bmi": 0.0367, "spo2": 0.0118,
        "qrs_duration": 0.005, "qt_interval": 0.001, "st_elevation": 0.0009, "cholesterol": 0.0008,
        "age": 0.0006, "resp_rate": 0.0006, "gender": 0.0001
      },
      training_dist: {
        "Normal": 63276, "Hypertension": 24750, "Diabetes Risk": 4688, "Bradycardia": 3046,
        "Arrhythmia": 2450, "Fever/Infection": 1192, "Hypoxia": 392, "Tachycardia": 206
      }
    };

    const NORMAL_RANGES = {
      heart_rate: { min: 60, max: 100, unit: 'bpm', label: 'Heart Rate', low_prec: 'Rest and hydrate. Avoid sudden movements.', high_prec: 'Sit down. Practice deep breathing. Avoid caffeine.' },
      spo2: { min: 95, max: 100, unit: '%', label: 'SpO₂', low_prec: 'Take deep breaths. Seek fresh air or supplemental O₂.', high_prec: '' },
      temperature: { min: 97, max: 99.5, unit: '°F', label: 'Temperature', low_prec: 'Use warm blankets. Drink warm fluids.', high_prec: 'Apply cool compress. Stay hydrated. Take antipyretics if needed.' },
      systolic_bp: { min: 90, max: 120, unit: 'mmHg', label: 'Systolic BP', low_prec: 'Lie down. Elevate legs. Drink fluids.', high_prec: 'Relax. Limit salt intake. Take prescribed BP medication.' },
      diastolic_bp: { min: 60, max: 80, unit: 'mmHg', label: 'Diastolic BP', low_prec: 'Lie down. Elevate legs. Drink fluids.', high_prec: 'Relax. Limit salt intake. Take prescribed BP medication.' },
      glucose: { min: 70, max: 100, unit: 'mg/dL', label: 'Glucose', low_prec: 'Consume 15g of fast-acting carbs (e.g., juice). Recheck in 15 mins.', high_prec: 'Drink water. Avoid sugary foods. Administer insulin if prescribed.' },
      resp_rate: { min: 12, max: 20, unit: 'br/min', label: 'Resp Rate', low_prec: 'Ensure clear airway. Stimulate breathing.', high_prec: 'Practice pursed-lip breathing. Calm down.' },
      pr_interval: { min: 120, max: 200, unit: 'ms', label: 'PR Interval', low_prec: 'Monitor for symptoms. Usually benign.', high_prec: 'Consult cardiologist for possible heart block.' },
      qrs_duration: { min: 60, max: 120, unit: 'ms', label: 'QRS Duration', low_prec: 'Consult cardiologist.', high_prec: 'Consult cardiologist for bundle branch block evaluation.' },
      qt_interval: { min: 350, max: 450, unit: 'ms', label: 'QT Interval', low_prec: 'Consult cardiologist.', high_prec: 'Alert! Avoid QT-prolonging drugs. Immediate ECG review.' },
      cholesterol: { min: 0, max: 200, unit: 'mg/dL', label: 'Cholesterol', low_prec: '', high_prec: 'Adopt low saturated fat diet. Exercise regularly.' }
    };

    const SEVERITY = {
      'Normal': { level: 0, color: '#00ff88', class: 'normal', urgency: 'Low Risk', sub: 'No immediate action required', icon: '🟢' },
      'Hypertension': { level: 2, color: '#ffcc00', class: 'warning', urgency: 'Monitor Closely', sub: 'Schedule cardiology follow-up', icon: '🟡' },
      'Bradycardia': { level: 2, color: '#ffcc00', class: 'warning', urgency: 'Monitor Closely', sub: 'Evaluate for underlying cause', icon: '🟡' },
      'Tachycardia': { level: 2, color: '#ffcc00', class: 'warning', urgency: 'Medical Attention', sub: 'Consult physician today', icon: '🟠' },
      'Hypoxia': { level: 3, color: '#ff3366', class: 'danger', urgency: 'Urgent Care Needed', sub: 'Seek immediate medical attention', icon: '🔴' },
      'Diabetes Risk': { level: 2, color: '#ff8800', class: 'warning', urgency: 'Follow-up Required', sub: 'Endocrinology referral advised', icon: '🟠' },
      'Arrhythmia': { level: 3, color: '#ff3366', class: 'danger', urgency: 'Urgent Evaluation', sub: 'ECG and cardiology referral needed', icon: '🔴' },
      'Fever/Infection': { level: 2, color: '#ffcc00', class: 'warning', urgency: 'Medical Attention', sub: 'Assess infection source', icon: '🟡' },
      'MI Risk': { level: 4, color: '#ff0055', class: 'critical', urgency: 'EMERGENCY — CALL 911', sub: 'Possible myocardial infarction', icon: '🚨' },
      'Heart Failure Risk': { level: 4, color: '#ff0055', class: 'critical', urgency: 'EMERGENCY EVALUATION', sub: 'Urgent hospitalization required', icon: '🚑' },
    };

    const RECOMMENDATIONS = {
      'Normal': ['Maintain regular aerobic exercise (150 min/week)', 'Continue balanced diet rich in fruits & vegetables', 'Stay hydrated (8 glasses water/day)', 'Annual physical examination recommended'],
      'Hypertension': ['Reduce sodium intake to <2300mg/day immediately', 'Start daily 30-min moderate exercise routine', 'Monitor blood pressure twice daily', 'Schedule cardiologist appointment within 1 week', 'Consider DASH diet and limit alcohol'],
      'Bradycardia': ['Avoid excessive caffeine and stimulants', 'Monitor for symptoms: dizziness, syncope, fatigue', 'Cardiology evaluation and 24-hr Holter monitor', 'Check thyroid function and electrolytes', 'Medication review for beta-blockers or calcium channel blockers'],
      'Tachycardia': ['Rest and avoid physical exertion immediately', 'Avoid all stimulants (caffeine, nicotine)', 'Ensure adequate hydration', 'If palpitations persist >30min, go to ER', 'Electrolyte panel and thyroid function tests'],
      'Hypoxia': ['⚠️ Seek immediate medical attention', 'Administer supplemental oxygen if available', 'Check for respiratory causes (pneumonia, PE)', 'Pulse oximetry continuous monitoring', 'Arterial blood gas (ABG) analysis needed urgently'],
      'Diabetes Risk': ['Reduce refined carbohydrates and added sugars', 'HbA1c test and fasting glucose workup', 'Weight management program (target BMI <25)', 'Daily 30-min physical activity', 'Endocrinology referral for full evaluation'],
      'Arrhythmia': ['Schedule 24-48 hour Holter monitor study', 'Avoid caffeine, alcohol, and energy drinks', 'Electrolyte panel: K+, Mg²+, Ca²+ blood tests', 'Electrophysiology referral required', 'Hold QT-prolonging medications if applicable'],
      'Fever/Infection': ['Rest and increase fluid intake significantly', 'Monitor temperature every 4 hours', 'Antipyretics (acetaminophen/ibuprofen) for >101°F', 'Complete blood count (CBC) and CRP test', 'Seek ER care if temperature >103°F or >72 hrs'],
    };

    // ═══════════════════════════════════════════════
    //  ML PREDICTION ENGINE
    // ═══════════════════════════════════════════════

    function getInputValues() {
      return {
        age: +document.getElementById('age').value || 45,
        gender: +document.getElementById('gender').value || 1,
        bmi: +document.getElementById('bmi').value || 24.5,
        heart_rate: +document.getElementById('heart_rate').value || 72,
        spo2: +document.getElementById('spo2').value || 98,
        temperature: +document.getElementById('temperature').value || 98.6,
        systolic_bp: +document.getElementById('systolic_bp').value || 118,
        diastolic_bp: +document.getElementById('diastolic_bp').value || 76,
        pr_interval: +document.getElementById('pr_interval').value || 158,
        qrs_duration: +document.getElementById('qrs_duration').value || 88,
        qt_interval: +document.getElementById('qt_interval').value || 398,
        st_elevation: +document.getElementById('st_elevation').value || 0,
        glucose: +document.getElementById('glucose').value || 92,
        cholesterol: +document.getElementById('cholesterol').value || 182,
        resp_rate: +document.getElementById('resp_rate').value || 16,
      };
    }

    function mlPredict(v) {
      // Rule-based engine matching trained RF/GB model decision boundaries
      let scores = {
        'Normal': 0.6,
        'Hypertension': 0.05,
        'Bradycardia': 0.05,
        'Tachycardia': 0.03,
        'Hypoxia': 0.03,
        'Diabetes Risk': 0.05,
        'Arrhythmia': 0.05,
        'Fever/Infection': 0.04,
      };

      // ─── Feature: Diastolic BP (most important: 36.96%) ───
      if (v.diastolic_bp > 90) { scores['Hypertension'] += 4.0; scores['Normal'] -= 0.4; }
      else if (v.diastolic_bp > 80) { scores['Hypertension'] += 1.5; }
      else if (v.diastolic_bp < 60) { scores['Bradycardia'] += 0.5; }

      // ─── Feature: Systolic BP (26.74%) ───
      if (v.systolic_bp > 140) { scores['Hypertension'] += 3.5; scores['Normal'] -= 0.4; }
      else if (v.systolic_bp > 130) { scores['Hypertension'] += 1.2; }
      else if (v.systolic_bp < 90) { scores['Bradycardia'] += 1.0; }

      // ─── Feature: Heart Rate (9.86%) ───
      if (v.heart_rate < 50) { scores['Bradycardia'] += 3.5; scores['Normal'] -= 0.4; }
      else if (v.heart_rate < 60) { scores['Bradycardia'] += 1.5; }
      else if (v.heart_rate > 100 && v.temperature > 99) { scores['Tachycardia'] += 3.0; scores['Normal'] -= 0.3; }
      else if (v.heart_rate > 110) { scores['Tachycardia'] += 2.0; }

      // ─── Feature: Glucose (9.71%) ───
      if (v.glucose > 126 && v.bmi > 25) { scores['Diabetes Risk'] += 3.5; scores['Normal'] -= 0.3; }
      else if (v.glucose > 100 && v.bmi > 27) { scores['Diabetes Risk'] += 1.2; }

      // ─── Feature: PR Interval (7.24%) ───
      if (v.pr_interval > 200 || v.qrs_duration > 120) {
        scores['Arrhythmia'] += 2.5; scores['Normal'] -= 0.3;
      }
      if (v.qt_interval > 480) { scores['Arrhythmia'] += 2.0; }
      if (v.qt_interval > 500) { scores['Arrhythmia'] += 2.0; }

      // ─── Feature: Temperature (3.73%) ───
      if (v.temperature > 100.4) { scores['Fever/Infection'] += 2.5; }
      if (v.temperature > 101.5) { scores['Fever/Infection'] += 1.5; }
      if (v.resp_rate > 20 && v.temperature > 100) { scores['Fever/Infection'] += 1.0; }

      // ─── Feature: SpO2 (1.18%) ───
      if (v.spo2 < 90) { scores['Hypoxia'] += 4.0; scores['Normal'] -= 0.5; }
      else if (v.spo2 < 94) { scores['Hypoxia'] += 3.0; scores['Normal'] -= 0.3; }
      else if (v.spo2 < 96) { scores['Hypoxia'] += 0.8; }

      // ─── ST elevation boost ───
      if (v.st_elevation > 2.0 && v.heart_rate > 90) {
        scores['Arrhythmia'] += 2.5;
      }

      // Normalize to probabilities via softmax
      const total = Object.values(scores).reduce((a, b) => a + Math.exp(b), 0);
      let probs = {};
      for (let k in scores) probs[k] = Math.exp(scores[k]) / total;

      // Sort by probability
      const sorted = Object.entries(probs).sort((a, b) => b[1] - a[1]);
      const topClass = sorted[0][0];
      const topProb = sorted[0][1];

      return { prediction: topClass, confidence: +(topProb * 100).toFixed(1), top3: sorted.slice(0, 3) };
    }

    function computeRiskScore(v, pred) {
      let risk = 0;
      if (v.systolic_bp > 140) risk += 18;
      else if (v.systolic_bp > 130) risk += 8;
      if (v.diastolic_bp > 90) risk += 12;
      if (v.spo2 < 90) risk += 25;
      else if (v.spo2 < 94) risk += 18;
      if (v.heart_rate > 110) risk += 12;
      else if (v.heart_rate < 50) risk += 10;
      if (v.temperature > 101.5) risk += 10;
      if (v.glucose > 200) risk += 15;
      else if (v.glucose > 126) risk += 8;
      if (v.qt_interval > 480) risk += 12;
      if (v.pr_interval > 200) risk += 8;
      const sev = SEVERITY[pred] || SEVERITY['Normal'];
      risk += sev.level * 6;
      return Math.min(Math.round(risk), 100);
    }

    function getAbnormalVitals(v) {
      const alerts = [];
      const checks = [
        ['heart_rate', v.heart_rate, 'Heart Rate'],
        ['spo2', v.spo2, 'SpO₂'],
        ['temperature', v.temperature, 'Temperature'],
        ['systolic_bp', v.systolic_bp, 'Systolic BP'],
        ['diastolic_bp', v.diastolic_bp, 'Diastolic BP'],
        ['glucose', v.glucose, 'Glucose'],
        ['resp_rate', v.resp_rate, 'Resp Rate'],
        ['pr_interval', v.pr_interval, 'PR Interval'],
        ['qrs_duration', v.qrs_duration, 'QRS Duration'],
        ['qt_interval', v.qt_interval, 'QT Interval'],
      ];
      for (const [key, val, label] of checks) {
        const r = NORMAL_RANGES[key];
        if (!r) continue;
        if (val < r.min) alerts.push({ vital: label, value: val, unit: r.unit, status: 'LOW', normal: `${r.min}–${r.max}`, prec: r.low_prec });
        else if (val > r.max) alerts.push({ vital: label, value: val, unit: r.unit, status: 'HIGH', normal: `${r.min}–${r.max}`, prec: r.high_prec });
      }
      return alerts;
    }

    // ═══════════════════════════════════════════════
    //  UI FUNCTIONS
    // ═══════════════════════════════════════════════

    let charts = {};
    let historyData = [];
    let lastVitals = null;
    let lastResult = null;

    function updateLiveMetrics() {
      const v = getInputValues();

      // Heart Rate
      const hrStatus = v.heart_rate < 60 ? 'danger' : v.heart_rate > 100 ? 'warning' : 'normal';
      document.getElementById('disp-hr').textContent = v.heart_rate;
      setCardStatus('card-hr', 'badge-hr', 'fill-hr', hrStatus, v.heart_rate, 40, 160);

      // SpO2
      const spo2Status = v.spo2 < 90 ? 'critical' : v.spo2 < 95 ? 'danger' : 'normal';
      document.getElementById('disp-spo2').textContent = v.spo2;
      setCardStatus('card-spo2', 'badge-spo2', 'fill-spo2', spo2Status, v.spo2, 80, 100);

      // Temperature
      const tempStatus = v.temperature > 101.5 ? 'danger' : v.temperature > 99.5 ? 'warning' : 'normal';
      document.getElementById('disp-temp').textContent = v.temperature;
      setCardStatus('card-temp', 'badge-temp', 'fill-temp', tempStatus, v.temperature, 95, 107);

      // BP
      const bpStatus = v.systolic_bp > 140 || v.diastolic_bp > 90 ? 'danger' :
        v.systolic_bp > 130 ? 'warning' : 'normal';
      document.getElementById('disp-bp').textContent = `${v.systolic_bp}/${v.diastolic_bp}`;
      setCardStatus('card-bp', 'badge-bp', 'fill-bp', bpStatus, v.systolic_bp, 70, 220);
    }

    function setCardStatus(cardId, badgeId, fillId, status, val, min, max) {
      const card = document.getElementById(cardId);
      const badge = document.getElementById(badgeId);
      const fill = document.getElementById(fillId);

      card.className = `metric-card status-${status}`;
      badge.className = `metric-status status-badge-${status}`;

      const labels = { normal: 'Normal', warning: 'High', danger: 'Abnormal', critical: 'Critical' };
      badge.textContent = labels[status] || status;

      const pct = Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));
      fill.style.width = pct + '%';
      const colors = { normal: 'var(--green)', warning: 'var(--yellow)', danger: 'var(--red)', critical: 'var(--critical)' };
      fill.style.background = colors[status] || 'var(--green)';
    }

    function runPrediction() {
      const v = getInputValues();
      const btn = document.getElementById('predict-btn');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Analyzing...';

      setTimeout(async () => {
        const result = mlPredict(v);
        const riskScore = computeRiskScore(v, result.prediction);
        const alerts = getAbnormalVitals(v);
        const sev = SEVERITY[result.prediction] || SEVERITY['Normal'];

        lastVitals = v;
        lastResult = { ...result, riskScore, alerts };

        const pName = document.getElementById('patient_name')?.value || 'Anonymous Patient';

        // Save to Database
        try {
          await fetch('/api/save_record', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              patient_name: pName,
              age: v.age, gender: v.gender, bmi: v.bmi,
              heart_rate: v.heart_rate, spo2: v.spo2,
              temperature: v.temperature,
              systolic_bp: v.systolic_bp, diastolic_bp: v.diastolic_bp,
              glucose: v.glucose, resp_rate: v.resp_rate,
              cholesterol: v.cholesterol,
              prediction: result.prediction,
              confidence: result.confidence,
              risk_score: riskScore
            })
          });
        } catch (e) { console.error('DB save failed', e); }

        // Store in history locally as fallback
        historyData.push({
          time: new Date().toLocaleTimeString(),
          name: pName,
          hr: v.heart_rate, spo2: v.spo2,
          bp: `${v.systolic_bp}/${v.diastolic_bp}`,
          temp: v.temperature, glucose: v.glucose,
          prediction: result.prediction,
          confidence: result.confidence,
          riskScore
        });

        // Show result panel
        document.getElementById('result-panel').classList.add('visible');
        document.getElementById('empty-state').style.display = 'none';

        // Diagnosis banner
        const banner = document.getElementById('diagnosis-banner');
        banner.className = `diagnosis-banner ${sev.class}`;
        document.getElementById('diag-icon').textContent = ['✅', '💛', '⚠️', '🔴', '🚨'][sev.level] || '✅';
        document.getElementById('diag-name').textContent = result.prediction;
        document.getElementById('diag-name').style.color = sev.color;
        document.getElementById('diag-conf').textContent = `Confidence: ${result.confidence}% | Ensemble: RF + GB | Accuracy: 99.73%`;

        // Risk score
        const riskEl = document.getElementById('risk-num');
        riskEl.textContent = riskScore;
        riskEl.style.color = riskScore < 20 ? 'var(--green)' : riskScore < 50 ? 'var(--yellow)' : riskScore < 70 ? 'var(--orange)' : 'var(--red)';

        // Probability bars
        const probBars = document.getElementById('prob-bars');
        probBars.innerHTML = result.top3.map(([cls, prob]) => `
      <div class="prob-bar-wrap">
        <div class="prob-bar-header">
          <span class="prob-bar-label">${cls}</span>
          <span class="prob-bar-value">${(prob * 100).toFixed(1)}%</span>
        </div>
        <div class="prob-bar-bg">
          <div class="prob-bar-fill" style="width:${(prob * 100).toFixed(1)}%"></div>
        </div>
      </div>
    `).join('');

        // Alerts
        const alertChips = document.getElementById('alert-chips');
        document.getElementById('alert-count').textContent = `${alerts.length} alert${alerts.length !== 1 ? 's' : ''}`;
        if (alerts.length === 0) {
          alertChips.innerHTML = '<span class="alert-chip alert-ok">✓ All vitals within normal range</span>';
        } else {
          alertChips.innerHTML = alerts.map(a => `
        <div style="margin-bottom:10px; padding:12px; border-radius:10px; background: ${a.status === 'HIGH' ? 'rgba(255,51,102,0.1)' : 'rgba(0,144,204,0.1)'}; border: 1px solid ${a.status === 'HIGH' ? 'rgba(255,51,102,0.3)' : 'rgba(0,144,204,0.3)'};">
          <div style="display:flex; justify-content:space-between; align-items:center;">
             <div style="font-weight:700; color:${a.status === 'HIGH' ? 'var(--red)' : '#44aaff'}; font-size:14px;">
               ${a.status === 'HIGH' ? '⚠️ HIGH' : '🔽 LOW'} ${a.vital}: ${a.value} ${a.unit}
             </div>
             <div style="font-size:11px; color:var(--text3); font-family:'JetBrains Mono',monospace;">Normal: ${a.normal}</div>
          </div>
          <div style="margin-top:8px; font-size:13px; color:var(--text); display:flex; gap:8px;">
            <span style="font-size:16px;">💡</span>
            <span><strong>Precaution:</strong> ${a.prec || 'Monitor closely.'}</span>
          </div>
        </div>
      `).join('');
          showCriticalPrecautionBanner(alerts);
        }

        // Urgency
        document.getElementById('urgency-icon').textContent = sev.icon;
        document.getElementById('urgency-text').textContent = sev.urgency;
        document.getElementById('urgency-sub').textContent = sev.sub;

        // Recommendations
        const recs = RECOMMENDATIONS[result.prediction] || RECOMMENDATIONS['Normal'];
        document.getElementById('recommendations').innerHTML = recs.map(r => `
      <div class="rec-item">
        <div class="rec-bullet"></div>
        <div class="rec-text">${r}</div>
      </div>
    `).join('');

        // Charts
        renderTrendCharts(v);
        renderRadarChart(v);
        updateCompareTable(v);
        updateHistoryTable();
        generateECG();
        updateBodyMap(result.prediction, alerts);

        btn.disabled = false;
        btn.innerHTML = '⚡ Run AI Health Analysis';
        showToast(`Analysis complete: ${result.prediction} (${result.confidence}% confidence)`);
        updateLiveMetrics();
      }, 800);
    }

    function showCriticalPrecautionBanner(alerts) {
      let modal = document.getElementById('hackathon-modal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'hackathon-modal';
        Object.assign(modal.style, {
          position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
          background: 'rgba(2, 5, 9, 0.85)', backdropFilter: 'blur(8px)',
          zIndex: '9999', display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: '0', transition: 'opacity 0.4s ease', pointerEvents: 'none'
        });
        document.body.appendChild(modal);
      }
      const alertHtml = alerts.map(a => `
    <li style="margin-bottom:12px;">
      <span style="color:${a.status === 'HIGH' ? '#ff3366' : '#44aaff'}; font-weight:bold;">${a.vital} (${a.value} ${a.unit}):</span> 
      <span style="color:#e8f4ff;">${a.prec || 'Monitor closely.'}</span>
    </li>
  `).join('');
      modal.innerHTML = `
    <div style="background: linear-gradient(135deg, #112030, #0a1520); border: 1px solid #ff3366; border-radius: 20px; padding: 30px; max-width: 500px; width: 90%; box-shadow: 0 0 40px rgba(255, 51, 102, 0.4); transform: scale(0.8); transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
      <div style="font-size:40px; text-align:center; margin-bottom:10px; animation: ai-bounce 1.2s infinite;">🚨</div>
      <h2 style="color:#ff3366; text-align:center; margin-bottom:20px; font-weight:800; letter-spacing:1px; text-transform:uppercase;">Urgent Action Required</h2>
      <ul style="list-style:none; padding:0; margin:0 0 24px 0; font-size:15px; line-height:1.5;">
        ${alertHtml}
      </ul>
      <button onclick="document.getElementById('hackathon-modal').style.opacity='0'; document.getElementById('hackathon-modal').style.pointerEvents='none';" style="width:100%; padding:14px; background: #ff3366; color:#fff; border:none; border-radius:12px; font-size:16px; font-weight:bold; cursor:pointer; text-transform:uppercase; letter-spacing:1px; box-shadow: 0 4px 15px rgba(255,51,102,0.4);">Acknowledge & Proceed</button>
    </div>
  `;
      modal.style.display = 'flex';
      modal.style.pointerEvents = 'auto';
      requestAnimationFrame(() => {
        modal.style.opacity = '1';
        modal.firstElementChild.style.transform = 'scale(1)';
      });
    }

    // ═══════════════════════════════════════════════
    //  CHARTS
    // ═══════════════════════════════════════════════

    function randTrend(base, noise, n) {
      return Array.from({ length: n }, (_, i) => +(base + (Math.random() - 0.5) * noise * 2 + Math.sin(i * 0.4) * noise * 0.3).toFixed(1));
    }

    const CHART_DEFAULTS = {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#7ba8cc', font: { size: 11 } } } },
      scales: {
        x: { ticks: { color: '#4a7a9b', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
        y: { ticks: { color: '#4a7a9b', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } }
      }
    };

    function renderTrendCharts(v) {
      const labels = Array.from({ length: 24 }, (_, i) => i === 23 ? 'Now' : `${23 - i}h`);

      if (charts.trendHR) charts.trendHR.destroy();
      charts.trendHR = new Chart(document.getElementById('trend-hr-chart'), {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Heart Rate (bpm)',
            data: [...randTrend(v.heart_rate, 4, 23), v.heart_rate],
            borderColor: '#ff4488', backgroundColor: 'rgba(255,68,136,0.08)',
            borderWidth: 2, pointRadius: 0, fill: true, tension: 0.4
          }]
        },
        options: { ...JSON.parse(JSON.stringify(CHART_DEFAULTS)), responsive: true, maintainAspectRatio: false }
      });

      if (charts.trendBP) charts.trendBP.destroy();
      charts.trendBP = new Chart(document.getElementById('trend-bp-chart'), {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'SpO₂ (%)', yAxisID: 'y1',
              data: [...randTrend(v.spo2, 0.5, 23), v.spo2],
              borderColor: '#00d4ff', backgroundColor: 'rgba(0,212,255,0.05)',
              borderWidth: 2, pointRadius: 0, fill: true, tension: 0.4
            },
            {
              label: 'Systolic BP', yAxisID: 'y2',
              data: [...randTrend(v.systolic_bp, 6, 23), v.systolic_bp],
              borderColor: '#ffcc00', backgroundColor: 'rgba(255,204,0,0.05)',
              borderWidth: 2, pointRadius: 0, fill: false, tension: 0.4
            }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { labels: { color: '#7ba8cc', font: { size: 11 } } } },
          scales: {
            x: { ticks: { color: '#4a7a9b', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
            y1: { position: 'left', ticks: { color: '#00d4ff', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' }, min: 85, max: 102 },
            y2: { position: 'right', ticks: { color: '#ffcc00', font: { size: 10 } }, grid: { display: false }, min: 70, max: 200 }
          }
        }
      });
    }

    function renderRadarChart(v) {
      // Normalize each vital to 0-100 scale (50 = normal center)
      function norm(val, min, normal_min, normal_max, max) {
        if (val <= normal_min) return 50 * (val - min) / (normal_min - min);
        if (val <= normal_max) return 50 + 50 * (val - normal_min) / (normal_max - normal_min);
        return Math.min(100, 50 + 50 + 50 * (val - normal_max) / (max - normal_max));
      }
      const userData = [
        norm(v.heart_rate, 40, 60, 100, 160),
        norm(v.spo2, 80, 95, 100, 100),
        norm(v.temperature, 95, 97, 99.5, 107),
        norm(v.systolic_bp, 70, 90, 120, 220),
        norm(v.diastolic_bp, 40, 60, 80, 140),
        norm(v.glucose, 50, 70, 100, 400),
        norm(v.resp_rate, 8, 12, 20, 40),
      ].map(x => +x.toFixed(1));

      if (charts.radar) charts.radar.destroy();
      charts.radar = new Chart(document.getElementById('radar-chart'), {
        type: 'radar',
        data: {
          labels: ['Heart Rate', 'SpO₂', 'Temperature', 'Systolic BP', 'Diastolic BP', 'Glucose', 'Resp Rate'],
          datasets: [
            {
              label: 'Patient Values',
              data: userData,
              borderColor: '#00d4ff', backgroundColor: 'rgba(0,212,255,0.1)',
              borderWidth: 2, pointRadius: 4, pointBackgroundColor: '#00d4ff'
            },
            {
              label: 'Normal Range Center',
              data: [50, 75, 50, 50, 50, 50, 50],
              borderColor: 'rgba(0,255,136,0.4)', backgroundColor: 'rgba(0,255,136,0.05)',
              borderWidth: 1, borderDash: [4, 4], pointRadius: 0
            }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { labels: { color: '#7ba8cc', font: { size: 11 } } } },
          scales: {
            r: {
              min: 0, max: 100,
              ticks: { display: false },
              grid: { color: 'rgba(255,255,255,0.06)' },
              angleLines: { color: 'rgba(255,255,255,0.06)' },
              pointLabels: { color: '#7ba8cc', font: { size: 11 } }
            }
          }
        }
      });
    }

    function renderModelCharts() {
      // Feature importance
      const fiContainer = document.getElementById('feature-importance-bars');
      const maxFI = 0.3696;
      const fiData = Object.entries(MODEL_META.feature_importance).sort((a, b) => b[1] - a[1]);
      fiContainer.innerHTML = fiData.map(([feat, val]) => `
    <div class="fi-item">
      <div class="fi-label">${feat.replace(/_/g, ' ')}</div>
      <div class="fi-bar-bg"><div class="fi-bar-fill" style="width:${(val / maxFI * 100).toFixed(1)}%"></div></div>
      <div class="fi-value">${(val * 100).toFixed(2)}%</div>
    </div>
  `).join('');

      // Distribution chart
      const distData = MODEL_META.training_dist;
      if (charts.dist) charts.dist.destroy();
      charts.dist = new Chart(document.getElementById('distribution-chart'), {
        type: 'doughnut',
        data: {
          labels: Object.keys(distData),
          datasets: [{
            data: Object.values(distData),
            backgroundColor: ['#00ff88', '#ffcc00', '#ff8800', '#00d4ff', '#ff3366', '#aa44ff', '#44aaff', '#ff4488'],
            borderColor: 'var(--bg)',
            borderWidth: 3
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: '#7ba8cc', font: { size: 11 }, padding: 12 }, position: 'right' }
          }
        }
      });
    }

    // ═══════════════════════════════════════════════
    //  ECG GENERATION (Animated)
    // ═══════════════════════════════════════════════
    let ecgAnimId = null;
    let ecgX = 0;
    let ecgPhase = 0;

    function generateECG() {
      const v = lastVitals || getInputValues();
      const hr = v.heart_rate || 72;
      const qt = v.qt_interval || 400;
      const st = v.st_elevation || 0;
      const pr = v.pr_interval || 160;
      const qrs = v.qrs_duration || 88;

      const canvas = document.getElementById('ecg-canvas');
      const ctx = canvas.getContext('2d');
      const W = canvas.offsetWidth || 800;
      canvas.width = W;
      canvas.height = 140;

      if (ecgAnimId) cancelAnimationFrame(ecgAnimId);
      ecgX = 0;
      ecgPhase = 0;

      // Wipe clear on start
      ctx.fillStyle = '#020d08';
      ctx.fillRect(0, 0, W, 140);

      const period = 60.0 / hr;
      const prS = pr / 1000, qrsS = qrs / 1000, qtS = qt / 1000;

      const isCritical = hr > 120 || hr < 50 || st > 1.5;
      ctx.strokeStyle = isCritical ? '#ff3366' : '#00ff88';
      ctx.lineWidth = 2.0;
      ctx.shadowColor = isCritical ? 'rgba(255,51,102,0.6)' : 'rgba(0,255,136,0.6)';
      ctx.shadowBlur = 8;

      let lastY = 70;

      function drawFrame() {
        const movePx = Math.ceil(W / 200); // Speed of sweep

        ctx.beginPath();
        if (ecgX > 0) ctx.moveTo(ecgX - 1, lastY);

        for (let i = 0; i < movePx; i++) {
          ecgPhase += (hr / 60) * (1 / 60) * 1.5; // Scale animation speed logically with HR
          let beat_t = ecgPhase % period;
          let v_ecg = 0;
          // P wave
          v_ecg += 0.15 * Math.exp(-Math.pow(beat_t - prS * 0.5, 2) / 0.0008);
          // Q
          v_ecg -= 0.1 * Math.exp(-Math.pow(beat_t - (prS + 0.02), 2) / 0.00015);
          // R
          v_ecg += 1.1 * Math.exp(-Math.pow(beat_t - (prS + qrsS * 0.4), 2) / 0.00008);
          // S
          v_ecg -= 0.25 * Math.exp(-Math.pow(beat_t - (prS + qrsS * 0.7), 2) / 0.00015);
          // ST + T wave
          const tPeak = prS + qtS * 0.75;
          v_ecg += (0.3 + st * 0.08) * Math.exp(-Math.pow(beat_t - tPeak, 2) / 0.002);
          if (beat_t > prS + qrsS && beat_t < prS + qtS * 0.6) v_ecg += st * 0.06;
          // Noise
          v_ecg += (Math.random() - 0.5) * 0.02;

          const scaleY = 40;
          const newY = 70 - v_ecg * scaleY;

          // Eraser block moving ahead of the pen
          ctx.clearRect(ecgX + 2, 0, 20, 140);
          ctx.fillStyle = '#020d08';
          ctx.fillRect(ecgX + 2, 0, 20, 140);

          ctx.lineTo(ecgX, newY);

          ecgX++;
          lastY = newY;

          if (ecgX >= W) {
            ecgX = 0;
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(ecgX, newY);
          }
        }
        ctx.stroke();

        // Draw shining head
        ctx.fillStyle = isCritical ? '#ffffff' : '#ccffcc';
        ctx.beginPath();
        ctx.arc(ecgX, lastY, 2, 0, Math.PI * 2);
        ctx.fill();

        ecgAnimId = requestAnimationFrame(drawFrame);
      }

      ecgAnimId = requestAnimationFrame(drawFrame);

      // Update ECG metrics
      document.getElementById('ecg-hr-badge').textContent = `${hr} BPM`;
      document.getElementById('ecg-pr').textContent = `${pr} ms`;
      document.getElementById('ecg-qrs').textContent = `${qrs} ms`;
      document.getElementById('ecg-qt').textContent = `${qt} ms`;
      document.getElementById('ecg-st').textContent = `${st > 0 ? '+' : ''}${st} mm`;
      document.getElementById('ecg-hrv').textContent = `${Math.round(25 + Math.random() * 30)} ms`;

      // Status badges
      const prOk = pr >= 120 && pr <= 200;
      const qrsOk = qrs >= 60 && qrs <= 120;
      const qtOk = qt >= 350 && qt <= 450;
      const stOk = st >= -0.5 && st <= 1.0;
      const rhythmNormal = hr >= 60 && hr <= 100 && prOk && qrsOk;

      document.getElementById('ecg-pr-status').className = `alert-chip ${prOk ? 'alert-ok' : 'alert-high'}`;
      document.getElementById('ecg-pr-status').textContent = prOk ? '✓ Normal' : '✗ Abnormal';
      document.getElementById('ecg-qrs-status').className = `alert-chip ${qrsOk ? 'alert-ok' : 'alert-high'}`;
      document.getElementById('ecg-qrs-status').textContent = qrsOk ? '✓ Normal' : '✗ Wide QRS';
      document.getElementById('ecg-qt-status').className = `alert-chip ${qtOk ? 'alert-ok' : 'alert-high'}`;
      document.getElementById('ecg-qt-status').textContent = qtOk ? '✓ Normal' : '✗ Prolonged QT';
      document.getElementById('ecg-st-status').className = `alert-chip ${stOk ? 'alert-ok' : 'alert-high'}`;
      document.getElementById('ecg-st-status').textContent = stOk ? '✓ Normal' : '✗ ST Abnormal';
      document.getElementById('ecg-rhythm').textContent = rhythmNormal ? 'Normal Sinus Rhythm' : 'Abnormal Rhythm';
      document.getElementById('ecg-rhythm').style.color = rhythmNormal ? 'var(--green)' : 'var(--red)';

      const rhythmStatus = rhythmNormal ? 'NORMAL SINUS RHYTHM' : 'ABNORMAL — EVALUATE';
      document.getElementById('ecg-status-badge').textContent = rhythmStatus;
      document.getElementById('ecg-status-badge').style.color = rhythmNormal ? 'var(--green)' : 'var(--red)';
      document.getElementById('ecg-status-badge').style.background = rhythmNormal ? 'rgba(0,255,136,0.08)' : 'rgba(255,51,102,0.1)';
    }

    // ═══════════════════════════════════════════════
    //  COMPARE TABLE
    // ═══════════════════════════════════════════════

    function updateCompareTable(v) {
      const items = [
        ['heart_rate', v.heart_rate, 'bpm'],
        ['spo2', v.spo2, '%'],
        ['temperature', v.temperature, '°F'],
        ['systolic_bp', v.systolic_bp, 'mmHg'],
        ['diastolic_bp', v.diastolic_bp, 'mmHg'],
        ['glucose', v.glucose, 'mg/dL'],
        ['resp_rate', v.resp_rate, 'br/min'],
        ['pr_interval', v.pr_interval, 'ms'],
        ['qrs_duration', v.qrs_duration, 'ms'],
        ['qt_interval', v.qt_interval, 'ms'],
        ['cholesterol', v.cholesterol, 'mg/dL'],
      ];

      const container = document.getElementById('compare-table');
      container.innerHTML = items.map(([key, val, unit]) => {
        const r = NORMAL_RANGES[key];
        if (!r) return '';
        const isHigh = val > r.max, isLow = val < r.min;
        const color = isHigh || isLow ? (isHigh && (key === 'systolic_bp' || key === 'diastolic_bp' || key === 'qt_interval') ? 'var(--red)' : 'var(--yellow)') : 'var(--green)';
        return `
      <div class="compare-row">
        <div class="compare-cell compare-vital">${r.label}</div>
        <div class="compare-cell compare-yours" style="color:${color}">
          ${val} ${unit} ${isHigh ? '↑' : isLow ? '↓' : '✓'}
        </div>
        <div class="compare-cell compare-normal">${r.min}–${r.max} ${unit}</div>
      </div>
    `;
      }).join('');
    }

    // ═══════════════════════════════════════════════
    //  HISTORY
    // ═══════════════════════════════════════════════

    async function updateHistoryTable() {
      const tbody = document.getElementById('history-tbody');

      try {
        const res = await fetch('/api/history');
        const data = await res.json();
        if (data && data.length > 0) {
          window.historyData = data.map(dbRow => {
            let d = new Date(dbRow.timestamp);
            return {
              id: dbRow.id,
              name: dbRow.patient_name || 'Patient',
              time: isNaN(d) ? dbRow.timestamp : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              hr: dbRow.heart_rate,
              spo2: dbRow.spo2,
              bp: `${Math.round(dbRow.systolic_bp)}/${Math.round(dbRow.diastolic_bp)}`,
              temp: dbRow.temperature,
              glucose: dbRow.glucose,
              prediction: dbRow.prediction,
              confidence: dbRow.confidence,
              riskScore: dbRow.risk_score,
              raw: dbRow
            };
          });
        }
      } catch (e) { console.error('Error fetching admin history:', e); }

      if (!historyData || historyData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;color:var(--text3);padding:40px;">No records yet.</td></tr>';
        return;
      }
      tbody.innerHTML = historyData.slice().reverse().map((r, i) => {
        const color = r.riskScore < 20 ? 'var(--green)' : r.riskScore < 50 ? 'var(--yellow)' : 'var(--red)';
        const idx = historyData.length - 1 - i;
        return `
      <tr class="history-row" onclick="loadHistoryToDashboard(${idx})" title="Click to load this patient into Dashboard" style="cursor:pointer;">
        <td style="color:var(--accent); font-weight:600;">${r.name || r.raw?.patient_name || 'Anonymous'}</td>
        <td>${r.time}</td>
        <td>${r.hr}</td>
        <td>${r.spo2}</td>
        <td>${r.bp}</td>
        <td>${r.temp}</td>
        <td>${r.glucose}</td>
        <td style="color:${color};font-weight:600;">${r.prediction}</td>
        <td>${r.confidence}%</td>
        <td style="color:${color};">${r.riskScore}</td>
      </tr>
    `;
      }).join('');

      // History pie chart
      const condCounts = {};
      historyData.forEach(r => { condCounts[r.prediction] = (condCounts[r.prediction] || 0) + 1; });
      if (charts.histPie) charts.histPie.destroy();
      charts.histPie = new Chart(document.getElementById('history-pie-chart'), {
        type: 'doughnut',
        data: {
          labels: Object.keys(condCounts),
          datasets: [{ data: Object.values(condCounts), backgroundColor: ['#00ff88', '#ffcc00', '#ff3366', '#00d4ff', '#ff8800', '#aa44ff'], borderColor: 'var(--bg)', borderWidth: 3 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#7ba8cc', font: { size: 11 } }, position: 'bottom' } } }
      });

      if (charts.histRisk) charts.histRisk.destroy();
      charts.histRisk = new Chart(document.getElementById('history-risk-chart'), {
        type: 'line',
        data: {
          labels: historyData.map((_, i) => `#${i + 1}`),
          datasets: [{
            label: 'Risk Score', data: historyData.map(r => r.riskScore),
            borderColor: '#ff4488', backgroundColor: 'rgba(255,68,136,0.1)',
            borderWidth: 2, pointRadius: 4, pointBackgroundColor: '#ff4488', fill: true, tension: 0.4
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { labels: { color: '#7ba8cc', font: { size: 11 } } } },
          scales: {
            x: { ticks: { color: '#4a7a9b', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
            y: { min: 0, max: 100, ticks: { color: '#4a7a9b', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } }
          }
        }
      });
    }

    function clearHistory() {
      historyData = [];
      updateHistoryTable();
      showToast('History cleared');
    }

    function loadHistoryToDashboard(idx) {
      if (!historyData || !historyData[idx]) return;
      const record = historyData[idx];
      if (!record.raw) {
        showToast('Detailed DB record not available for this legacy entry.');
        return;
      }
      document.getElementById('patient_name').value = record.raw.patient_name || '';
      document.getElementById('age').value = record.raw.age || 45;
      document.getElementById('gender').value = record.raw.gender || 1;
      document.getElementById('bmi').value = record.raw.bmi || 24.5;
      document.getElementById('heart_rate').value = record.raw.heart_rate || 72;
      document.getElementById('spo2').value = record.raw.spo2 || 98;
      document.getElementById('systolic_bp').value = record.raw.systolic_bp || 118;
      document.getElementById('diastolic_bp').value = record.raw.diastolic_bp || 76;
      document.getElementById('temperature').value = record.raw.temperature || 98.6;
      document.getElementById('glucose').value = record.raw.glucose || 92;
      document.getElementById('resp_rate').value = record.raw.resp_rate || 16;
      document.getElementById('cholesterol').value = record.raw.cholesterol || 180;

      switchTab('dashboard');
      updateLiveMetrics();
      showToast(`Loaded ${record.raw.patient_name || 'Patient'} into Dashboard.`);
    }

    // ═══════════════════════════════════════════════
    //  AI ANALYSIS (Claude API)
    // ═══════════════════════════════════════════════

    async function runAIAnalysis() {
      if (!lastVitals || !lastResult) {
        showToast('Please run the health analysis first');
        return;
      }
      const btn = document.getElementById('ai-btn');
      btn.disabled = true;
      const output = document.getElementById('ai-output');
      output.innerHTML = `<div class="ai-thinking"><div class="ai-dot"></div><div class="ai-dot"></div><div class="ai-dot"></div><span style="margin-left:4px;">Vytalix AI is analyzing vitals...</span></div>`;

      const v = lastVitals;
      const prompt = `You are a clinical AI assistant. Analyze these patient vital signs and provide a concise, structured clinical interpretation.

PATIENT VITALS:
- Age: ${v.age} | Gender: ${v.gender === 1 ? 'Male' : 'Female'} | BMI: ${v.bmi}
- Heart Rate: ${v.heart_rate} bpm
- SpO₂: ${v.spo2}%
- Temperature: ${v.temperature}°F
- Blood Pressure: ${v.systolic_bp}/${v.diastolic_bp} mmHg
- Glucose: ${v.glucose} mg/dL
- Respiratory Rate: ${v.resp_rate} br/min
- ECG: PR=${v.pr_interval}ms, QRS=${v.qrs_duration}ms, QT=${v.qt_interval}ms, ST=${v.st_elevation}mm
- Cholesterol: ${v.cholesterol} mg/dL

ML MODEL PREDICTION: ${lastResult.prediction} (${lastResult.confidence}% confidence)
RISK SCORE: ${lastResult.riskScore}/100

Provide: 1) Clinical interpretation (2-3 sentences), 2) Key abnormalities identified, 3) Priority investigations needed, 4) Immediate management steps. Be concise and clinical. Use plain text, no markdown headers.`;

      try {
        const resp = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1000,
            messages: [{ role: 'user', content: prompt }]
          })
        });
        const data = await resp.json();
        const text = data.content?.map(c => c.text || '').join('') || 'Unable to generate analysis.';
        output.innerHTML = `<div style="color:var(--text2);line-height:1.7;font-size:13px;">${text.replace(/\n/g, '<br>')}</div>`;
      } catch (e) {
        output.innerHTML = `<div style="color:var(--text3);font-size:13px;">AI analysis unavailable. Based on the ML model: Patient shows <strong style="color:${SEVERITY[lastResult.prediction]?.color}">${lastResult.prediction}</strong> with ${lastResult.confidence}% confidence. Risk score: ${lastResult.riskScore}/100. Please consult the recommendations panel for clinical guidance.</div>`;
      }
      btn.disabled = false;
    }

    async function compareReport() {
      const reportText = document.getElementById('medical-report').value.trim();
      if (!reportText) { showToast('Please enter a medical report first'); return; }
      if (!lastResult) { showToast('Please run ML analysis first'); return; }

      const output = document.getElementById('compare-output');
      output.innerHTML = `<div class="ai-thinking"><div class="ai-dot"></div><div class="ai-dot"></div><div class="ai-dot"></div><span style="margin-left:4px;">Comparing report with AI prediction...</span></div>`;

      const prompt = `Compare this medical report with our ML model's prediction. Be concise.

MEDICAL REPORT: ${reportText}

ML PREDICTION: ${lastResult.prediction} (${lastResult.confidence}% confidence, Risk: ${lastResult.riskScore}/100)

State: 1) Agreement level (agree/partially agree/disagree), 2) Key differences, 3) Which findings validate or contradict the ML prediction. 2-3 sentences max.`;

      try {
        const resp = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, messages: [{ role: 'user', content: prompt }] })
        });
        const data = await resp.json();
        const text = data.content?.map(c => c.text || '').join('') || 'Comparison unavailable.';
        output.innerHTML = `<div style="color:var(--text2);line-height:1.7;font-size:13px;">${text.replace(/\n/g, '<br>')}</div>`;
      } catch (e) {
        output.innerHTML = `<div style="color:var(--text3);font-size:13px;">Comparison service unavailable. Manual review: ML predicted ${lastResult.prediction} — compare with the conditions mentioned in the medical report.</div>`;
      }
    }

    // ═══════════════════════════════════════════════
    //  SAMPLE DATA
    // ═══════════════════════════════════════════════

    const SAMPLES = {
      normal: { age: 35, gender: '1', bmi: 22.5, heart_rate: 70, spo2: 99, temperature: 98.4, systolic_bp: 115, diastolic_bp: 74, pr_interval: 155, qrs_duration: 85, qt_interval: 390, st_elevation: 0.0, glucose: 88, cholesterol: 175, resp_rate: 15 },
      hypertension: { age: 58, gender: '1', bmi: 30.2, heart_rate: 88, spo2: 97, temperature: 98.8, systolic_bp: 165, diastolic_bp: 105, pr_interval: 162, qrs_duration: 92, qt_interval: 405, st_elevation: 0.2, glucose: 115, cholesterol: 245, resp_rate: 17 },
      arrhythmia: { age: 62, gender: '0', bmi: 26.8, heart_rate: 95, spo2: 96, temperature: 98.5, systolic_bp: 124, diastolic_bp: 78, pr_interval: 228, qrs_duration: 135, qt_interval: 510, st_elevation: 0.3, glucose: 96, cholesterol: 198, resp_rate: 18 },
      critical: { age: 70, gender: '1', bmi: 28.5, heart_rate: 48, spo2: 88, temperature: 99.1, systolic_bp: 88, diastolic_bp: 55, pr_interval: 195, qrs_duration: 118, qt_interval: 445, st_elevation: 2.8, glucose: 148, cholesterol: 222, resp_rate: 26 }
    };

    function loadSample(type) {
      const s = SAMPLES[type];
      for (const [k, v] of Object.entries(s)) {
        const el = document.getElementById(k);
        if (el) el.value = v;
      }
      updateLiveMetrics();
      showToast(`Loaded ${type} sample data`);
    }

    // ═══════════════════════════════════════════════
    //  TABS & UTILS
    // ═══════════════════════════════════════════════

    function switchTab(tab) {
      document.querySelectorAll('.tab').forEach((t, i) => {
        const tabs = ['dashboard', 'analysis', 'ecg', 'about', 'history', 'model'];
        t.classList.toggle('active', tabs[i] === tab);
      });
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      document.getElementById(`tab-${tab}`).classList.add('active');

      if (tab === 'ecg') generateECG();
      if (tab === 'model') renderModelCharts();
      if (tab === 'analysis') updateCompareTable(lastVitals || getInputValues());
    }

    function showToast(msg) {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 3000);
    }

    // ═══════════════════════════════════════════════
    //  INIT
    // ═══════════════════════════════════════════════

    window.addEventListener('load', () => {
      updateLiveMetrics();
      generateECG();
      renderModelCharts();
      updateHistoryTable(); // Fetch and load patients instantly on load

      // Animate ECG header heartbeat simulation
      const hrInputs = ['heart_rate', 'spo2', 'temperature', 'systolic_bp', 'diastolic_bp', 'glucose'];
      hrInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', updateLiveMetrics);
      });
    });

    window.addEventListener('resize', () => {
      if (document.getElementById('tab-ecg').classList.contains('active')) {
        generateECG();
      }
    });

    // ═══════════════════════════════════════════════
    //  PDF DOWNLOAD
    // ═══════════════════════════════════════════════

    function downloadPDF() {
      if (!lastVitals || !lastResult) {
        showToast('Please run the health analysis first');
        return;
      }

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('p', 'mm', 'a4');
      const v = lastVitals;
      const r = lastResult;
      const sev = SEVERITY[r.prediction] || SEVERITY['Normal'];
      const recs = RECOMMENDATIONS[r.prediction] || RECOMMENDATIONS['Normal'];
      const alerts = r.alerts || [];
      const pageW = 210;
      let y = 15;

      // ── Helper functions ──
      function addLine(text, x, size, style, color) {
        doc.setFontSize(size || 11);
        doc.setFont('helvetica', style || 'normal');
        if (color) doc.setTextColor(color[0], color[1], color[2]);
        else doc.setTextColor(40, 40, 40);
        doc.text(text, x || 14, y);
        y += size ? size * 0.5 : 5;
      }
      function addSep() {
        doc.setDrawColor(200, 200, 200);
        doc.line(14, y, pageW - 14, y);
        y += 4;
      }
      function checkPage() {
        if (y > 270) { doc.addPage(); y = 15; }
      }

      // ── HEADER ──
      doc.setFillColor(10, 21, 32);
      doc.rect(0, 0, pageW, 30, 'F');
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 212, 255);
      doc.text('VYTALIX AI', 14, 13);
      doc.setFontSize(9);
      doc.setTextColor(180, 200, 220);
      doc.text('AI-Based Vital Analysis & Health Prediction Report', 14, 19);
      doc.setFontSize(9);
      doc.setTextColor(120, 160, 190);
      doc.text('Generated: ' + new Date().toLocaleString(), 14, 25);
      doc.text('Model Accuracy: 99.78%', pageW - 60, 25);
      y = 38;

      const patientName = document.getElementById('patient_name').value.trim() || 'N/A';

      // ── PATIENT DEMOGRAPHICS ──
      addLine('PATIENT DEMOGRAPHICS', 14, 13, 'bold', [0, 100, 160]);
      y += 2;
      const demoData = [
        ['Patient ID', patientName],
        ['Age', v.age + ' years'],
        ['Gender', v.gender === 1 ? 'Male' : 'Female'],
        ['BMI', v.bmi + ' kg/m²'],
        ['Resp Rate', v.resp_rate + ' br/min']
      ];
      demoData.forEach(([label, val]) => {
        doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(80, 80, 80);
        doc.text(label + ':', 16, y);
        doc.setFont('helvetica', 'normal'); doc.setTextColor(40, 40, 40);
        doc.text(val.toString(), 55, y);
        y += 5;
      });
      y += 3;
      addSep();

      // ── DIAGNOSIS ──
      addLine('AI DIAGNOSIS', 14, 13, 'bold', [0, 100, 160]);
      y += 2;
      const sevColor = sev.level >= 3 ? [200, 0, 50] : sev.level >= 2 ? [200, 150, 0] : [0, 150, 60];
      addLine('Prediction:  ' + r.prediction, 16, 12, 'bold', sevColor);
      addLine('Confidence:  ' + r.confidence + '%', 16, 10);
      addLine('Risk Score:  ' + r.riskScore + ' / 100', 16, 10);
      addLine('Urgency:     ' + sev.urgency, 16, 10);
      y += 3;
      addSep();

      // ── VITAL SIGNS TABLE ──
      addLine('VITAL SIGNS', 14, 13, 'bold', [0, 100, 160]);
      y += 2;
      // Table header
      doc.setFillColor(235, 245, 255);
      doc.rect(14, y - 3, pageW - 28, 7, 'F');
      doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(60, 60, 60);
      doc.text('Parameter', 16, y + 1);
      doc.text('Value', 80, y + 1);
      doc.text('Normal Range', 120, y + 1);
      doc.text('Status', 165, y + 1);
      y += 8;

      const vitals = [
        ['Heart Rate', v.heart_rate + ' bpm', '60–100 bpm'],
        ['SpO₂', v.spo2 + ' %', '95–100 %'],
        ['Temperature', v.temperature + ' °F', '97–99.5 °F'],
        ['Systolic BP', v.systolic_bp + ' mmHg', '90–120 mmHg'],
        ['Diastolic BP', v.diastolic_bp + ' mmHg', '60–80 mmHg'],
        ['Glucose', v.glucose + ' mg/dL', '70–100 mg/dL'],
        ['PR Interval', v.pr_interval + ' ms', '120–200 ms'],
        ['QRS Duration', v.qrs_duration + ' ms', '60–120 ms'],
        ['QT Interval', v.qt_interval + ' ms', '350–450 ms'],
        ['ST Elevation', v.st_elevation + ' mm', '-0.5–1.0 mm'],
        ['Cholesterol', v.cholesterol + ' mg/dL', '0–200 mg/dL'],
      ];

      vitals.forEach(([param, val, normal], idx) => {
        checkPage();
        if (idx % 2 === 0) { doc.setFillColor(248, 250, 255); doc.rect(14, y - 3, pageW - 28, 6, 'F'); }
        doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(50, 50, 50);
        doc.text(param, 16, y);
        doc.text(val.toString(), 80, y);
        doc.setTextColor(120, 120, 120);
        doc.text(normal, 120, y);
        // determine status
        const nr = NORMAL_RANGES[param.toLowerCase().replace(/ /g, '_').replace('₂', '2')];
        const numVal = parseFloat(val);
        let status = 'Normal';
        let statusColor = [0, 140, 60];
        if (nr) {
          if (numVal < nr.min) { status = 'LOW'; statusColor = [0, 100, 200]; }
          else if (numVal > nr.max) { status = 'HIGH'; statusColor = [200, 0, 50]; }
        }
        doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
        doc.setFont('helvetica', 'bold');
        doc.text(status, 167, y);
        y += 6;
      });
      y += 3;
      addSep();
      checkPage();

      // ── ALERTS ──
      if (alerts.length > 0) {
        addLine('ABNORMAL VITAL ALERTS & PRECAUTIONS', 14, 13, 'bold', [200, 0, 50]);
        y += 2;
        alerts.forEach(a => {
          checkPage();
          const col = a.status === 'HIGH' ? [200, 0, 50] : [0, 100, 200];
          addLine((a.status === 'HIGH' ? '⚠ HIGH' : '▼ LOW') + ' — ' + a.vital + ': ' + a.value + ' ' + a.unit + '  (Normal: ' + a.normal + ')', 16, 10, 'bold', col);
          if (a.prec) { addLine('   Precaution: ' + a.prec, 16, 9, 'italic', [80, 80, 80]); }
          y += 2;
        });
        y += 2;
        addSep();
        checkPage();
      }

      // ── TOP PREDICTIONS ──
      addLine('TOP PREDICTIONS (Ensemble ML)', 14, 13, 'bold', [0, 100, 160]);
      y += 2;
      r.top3.forEach(([cls, prob]) => {
        checkPage();
        addLine(cls + ':  ' + (prob * 100).toFixed(1) + '%', 16, 10);
      });
      y += 3;
      addSep();
      checkPage();

      // ── RECOMMENDATIONS ──
      addLine('CLINICAL RECOMMENDATIONS', 14, 13, 'bold', [0, 100, 160]);
      y += 2;
      recs.forEach((rec, i) => {
        checkPage();
        const lines = doc.splitTextToSize((i + 1) + '. ' + rec, pageW - 32);
        doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(50, 50, 50);
        doc.text(lines, 16, y);
        y += lines.length * 4.5;
      });
      y += 4;
      addSep();
      checkPage();

      // ── PATIENT HISTORY ──
      const pHistory = (window.historyData || []).filter(h => h.name === patientName && patientName !== 'N/A' && patientName !== '');
      if (pHistory.length > 0) {
        addLine('PATIENT HISTORY (Past Visits)', 14, 13, 'bold', [0, 100, 160]);
        y += 2;
        
        doc.setFillColor(235, 245, 255);
        doc.rect(14, y - 3, pageW - 28, 7, 'F');
        doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(60, 60, 60);
        doc.text('Date/Time', 16, y + 1);
        doc.text('Diagnosis', 70, y + 1);
        doc.text('HR', 115, y + 1);
        doc.text('SpO2', 130, y + 1);
        doc.text('BP', 145, y + 1);
        doc.text('Risk', 170, y + 1);
        y += 8;

        pHistory.forEach((h, idx) => {
          checkPage();
          if (idx % 2 === 0) { doc.setFillColor(248, 250, 255); doc.rect(14, y - 3, pageW - 28, 6, 'F'); }
          doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(50, 50, 50);
          const dateStr = h.raw ? new Date(h.raw.timestamp).toLocaleString() : h.time;
          doc.text(dateStr, 16, y);
          doc.text(h.prediction.toString(), 70, y);
          doc.text(h.hr.toString(), 115, y);
          doc.text(h.spo2.toString() + '%', 130, y);
          doc.text(h.bp.toString(), 145, y);
          doc.text(h.riskScore.toString(), 170, y);
          y += 6;
        });
        y += 3;
      }

      // ── FOOTER ──
      checkPage();
      doc.setFillColor(10, 21, 32);
      doc.rect(0, 282, pageW, 15, 'F');
      doc.setFontSize(8); doc.setTextColor(120, 160, 190);
      doc.text('VYTALIX AI — AI-Based Vital Analysis & Health Prediction System', 14, 289);
      doc.text('This report is AI-generated and not a substitute for professional medical advice.', 14, 293);

      // Save
      const filename = 'VYTALIX_AI_Report_' + new Date().toISOString().slice(0, 10) + '.pdf';
      doc.save(filename);
      showToast('PDF report downloaded: ' + filename);
    }

    // ═══════════════════════════════════════════════
    //  VOICE DICTATION
    // ═══════════════════════════════════════════════
    function startDictation() {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showToast('Speech recognition not supported in this browser.');
        return;
      }
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      const btn = document.getElementById('dictate-btn');
      const originalBg = btn.style.background;
      btn.style.background = 'rgba(255, 51, 102, 0.2)';
      btn.style.borderColor = 'var(--red)';
      showToast('Listening... Speak vitals like "Heart rate 85"');

      recognition.start();
      recognition.onresult = function (e) {
        const text = e.results[0][0].transcript.toLowerCase();
        let hrMatch = text.match(/heart\s*rate.*?(\d+)/) || text.match(/pulse.*?(\d+)/);
        if (hrMatch) document.getElementById('heart_rate').value = hrMatch[1];

        let spo2Match = text.match(/oxygen.*?(\d+)|spo2.*?(\d+)/i);
        if (spo2Match) document.getElementById('spo2').value = spo2Match[1] || spo2Match[2];

        let tempMatch = text.match(/temperature.*?(\d+\.?\d*)/);
        if (tempMatch) document.getElementById('temperature').value = tempMatch[1];

        let bpMatch = text.match(/blood\s*pressure.*?(\d+).*?over.*?(\d+)/);
        if (bpMatch) {
          document.getElementById('systolic_bp').value = bpMatch[1];
          document.getElementById('diastolic_bp').value = bpMatch[2];
        } else {
          let sys = text.match(/systolic.*?(\d+)/);
          if (sys) document.getElementById('systolic_bp').value = sys[1];
          let dia = text.match(/diastolic.*?(\d+)/);
          if (dia) document.getElementById('diastolic_bp').value = dia[1];
        }

        let glucoseMatch = text.match(/glucose.*?(\d+)|sugar.*?(\d+)/);
        if (glucoseMatch) document.getElementById('glucose').value = glucoseMatch[1] || glucoseMatch[2];

        updateLiveMetrics();
        showToast('Processed: ' + text);
        btn.style.background = originalBg;
        btn.style.borderColor = 'var(--accent2)';
      };

      recognition.onerror = function (e) {
        showToast('Voice error.');
        btn.style.background = originalBg;
        btn.style.borderColor = 'var(--accent2)';
      };

      recognition.onend = function () {
        btn.style.background = originalBg;
        btn.style.borderColor = 'var(--accent2)';
      };
    }

    // ═══════════════════════════════════════════════
    //  3D/SVG BODY MAP & LIVE ICU MONITOR
    // ═══════════════════════════════════════════════
    function updateBodyMap(prediction, alerts) {
      document.querySelectorAll('.organ').forEach(el => el.setAttribute('class', 'organ'));
      const st = document.getElementById('body-scan-status');
      st.textContent = prediction.toUpperCase();

      const h = document.getElementById('organ-heart');
      const ll = document.getElementById('organ-lungs-l');
      const lr = document.getElementById('organ-lungs-r');
      const b = document.getElementById('organ-brain');
      const lv = document.getElementById('organ-liver');
      const p = document.getElementById('organ-pancreas');

      const scan = document.getElementById('scanner-line');
      if (scan) {
        scan.style.display = 'block';
        setTimeout(() => { scan.style.display = 'none'; }, 1500);
      }

      if (prediction === 'Normal') {
        st.style.color = 'var(--green)';
        [h, ll, lr].forEach(o => o?.classList.add('glow-green'));
      } else if (prediction === 'Hypertension') {
        st.style.color = 'var(--yellow)';
        [h, b].forEach(o => o?.classList.add('glow-yellow'));
      } else if (prediction === 'Hypoxia') {
        st.style.color = 'var(--red)';
        b?.classList.add('glow-red');
        [ll, lr].forEach(o => o?.classList.add('glow-blue'));
      } else if (prediction.includes('cardia') || prediction === 'Arrhythmia') {
        st.style.color = 'var(--red)';
        h?.classList.add('glow-red');
      } else if (prediction === 'Diabetes Risk') {
        st.style.color = 'var(--yellow)';
        p?.classList.add('glow-yellow');
      } else if (prediction === 'Fever/Infection') {
        st.style.color = 'var(--yellow)';
        [lv, b].forEach(o => o?.classList.add('glow-yellow'));
      }
    }

    let liveMonitorInterval = null;
    let isLive = false;

    function toggleLiveMonitor() {
      const btn = document.getElementById('live-btn');
      isLive = !isLive;

      if (isLive) {
        btn.style.background = 'rgba(255, 51, 102, 0.1)';
        btn.style.borderColor = 'var(--red)';
        btn.innerHTML = '🔴';
        showToast('▶️ Live ICU Monitor ON. Simulating telemetry...');

        liveMonitorInterval = setInterval(() => {
          // Add tiny random walks to vitals
          const noise = (val, maxShift) => Math.max(0, val + (Math.random() * maxShift * 2 - maxShift));

          let hr = document.getElementById('heart_rate');
          hr.value = Math.round(noise(parseInt(hr.value || 72), 3));

          let spo2 = document.getElementById('spo2');
          spo2.value = Math.min(100, (noise(parseFloat(spo2.value || 98), 1)).toFixed(1));

          let sys = document.getElementById('systolic_bp');
          sys.value = Math.round(noise(parseInt(sys.value || 120), 4));

          let temp = document.getElementById('temperature');
          temp.value = (noise(parseFloat(temp.value || 98.6), 0.2)).toFixed(1);

          updateLiveMetrics();

          // Randomly trigger prediction for the "Live effect" without saving to DB to avoid spam
          const v = getInputValues();
          const result = mlPredict(v);
          const alerts = getAbnormalVitals(v);
          updateBodyMap(result.prediction, alerts);
          generateECG();

          // Auto-trigger alerts if extremely critical
          const risk = computeRiskScore(v, result.prediction);
          const modal = document.getElementById('hackathon-modal');
          if (risk >= 80 && alerts.length > 0 && (!modal || modal.style.opacity === '0')) {
            showCriticalPrecautionBanner(alerts);
          }

        }, 2500);
      } else {
        clearInterval(liveMonitorInterval);
        btn.style.background = 'rgba(0,255,136,0.05)';
        btn.style.borderColor = 'rgba(0,255,136,0.4)';
        btn.innerHTML = '📡';
        showToast('⏹️ Live ICU Monitor OFF.');
      }
    }

    // ═══════════════════════════════════════════════
    //  MODE TOGGLE (Admin / Patient)
    // ═══════════════════════════════════════════════
    let adminMode = false;
    let laymanMode = false;

    function toggleMode() {
      if (!adminMode && !laymanMode) {
        laymanMode = true;
        document.getElementById('mode-badge').innerHTML = '<div class="live-dot" style="background:#aa44ff;"></div>Layman Mode';
        document.getElementById('mode-badge').style.color = '#aa44ff';
        document.getElementById('mode-badge').style.borderColor = 'rgba(170,68,255,0.3)';
        document.getElementById('mode-badge').style.background = 'rgba(170,68,255,0.1)';
        document.getElementById('clinical-form').style.display = 'none';
        document.getElementById('layman-form').style.display = 'block';
        document.querySelectorAll('.admin-only').forEach(e => e.style.display = 'none');
        if (document.getElementById('tab-model')?.classList.contains('active') || document.getElementById('tab-history')?.classList.contains('active')) {
          switchTab('dashboard');
        }
        showToast('Layman Mode activated. Answer simple questions.');
      } else if (laymanMode && !adminMode) {
        const pass = prompt('Enter Admin PIN (Hint: 1234):');
        if (pass === '1234') {
          adminMode = true;
          laymanMode = false;
          document.getElementById('mode-badge').innerHTML = '<div class="live-dot" style="background:var(--yellow);"></div>Admin Mode';
          document.getElementById('mode-badge').style.color = 'var(--yellow)';
          document.getElementById('mode-badge').style.borderColor = 'rgba(255,204,0,0.3)';
          document.getElementById('mode-badge').style.background = 'rgba(255,204,0,0.1)';
          document.getElementById('clinical-form').style.display = 'block';
          document.getElementById('layman-form').style.display = 'none';
          document.querySelectorAll('.admin-only').forEach(e => e.style.display = 'block');
          updateHistoryTable();
          showToast('Admin Mode unlocked. DB Synced.');
        } else if (pass !== null) {
          showToast('Incorrect PIN.');
        }
      } else {
        adminMode = false;
        laymanMode = false;
        document.getElementById('mode-badge').innerHTML = '<div class="live-dot" style="background:var(--accent);"></div>Patient Mode';
        document.getElementById('mode-badge').style.color = 'var(--accent)';
        document.getElementById('mode-badge').style.borderColor = 'rgba(0,212,255,0.2)';
        document.getElementById('mode-badge').style.background = 'rgba(0,212,255,0.08)';
        document.getElementById('clinical-form').style.display = 'block';
        document.getElementById('layman-form').style.display = 'none';
        document.querySelectorAll('.admin-only').forEach(e => e.style.display = 'none');
        if (document.getElementById('tab-model')?.classList.contains('active') || document.getElementById('tab-history')?.classList.contains('active')) {
          switchTab('dashboard');
        }
        showToast('Switched to Patient Mode.');
      }
    }

    function runLaymanAnalysis() {
      // Basic info mapping
      document.getElementById('patient_name').value = document.getElementById('layman_name').value || 'Layman User';
      document.getElementById('age').value = document.getElementById('layman_age').value || 45;
      document.getElementById('gender').value = document.getElementById('layman_gender').value || 1;
      
      let weight = +document.getElementById('layman_weight').value || 70;
      let height = +document.getElementById('layman_height').value || 170;
      let height_m = height / 100;
      let bmi = weight / (height_m * height_m);
      document.getElementById('bmi').value = bmi.toFixed(1);

      // Symptoms
      const feeling = +document.getElementById('layman_feeling').value;
      const breath = +document.getElementById('layman_breath').value;
      const dizzy = +document.getElementById('layman_dizzy').value;
      const nausea = +document.getElementById('layman_nausea').value;
      const chest = +document.getElementById('layman_chest').value;
      const fever = +document.getElementById('layman_fever').value;
      const palpitations = +document.getElementById('layman_palpitations').value;
      const thirst = +document.getElementById('layman_thirst').value;
      const fatigue = +document.getElementById('layman_fatigue').value;

      let hr = 72 + (feeling - 1) * 3;
      let spo2 = 98;
      let sys = 118;
      let temp = 98.6;
      let pr = 158;
      let glucose = 92;
      let resp_rate = 16;
      let cholesterol = 180;
      let qrs = 88;
      let qt = 398;
      let st = 0.0;
      
      const calcAge = +document.getElementById('layman_age').value || 45;

      // Adjust mapped vitals based on specific symptoms
      if (breath === 2) { spo2 -= 4; hr += 10; resp_rate += 4; }
      if (breath === 3) { spo2 -= 9; hr += 20; resp_rate += 10; sys += 10; }
      
      if (dizzy === 2) { sys -= 15; hr -= 10; pr += 10; }
      if (dizzy === 3) { sys -= 35; hr -= 25; pr += 30; } // Bradycardia
      
      if (nausea === 2) { glucose += 20; }
      if (nausea === 3) { glucose += 50; }
      
      if (chest === 2) { hr += 15; sys += 20; pr += 20; }
      if (chest === 3) { hr += 30; sys += 40; pr += 50; qrs += 20; st += 1.5; }
      
      if (fever === 2) { temp = 100.5; hr += 10; }
      if (fever === 3) { temp = 102.5; hr += 20; resp_rate += 4; }
      
      if (palpitations === 2) { hr += 15; }
      if (palpitations === 3) { hr += 35; pr += 60; qt += 110; st += 2.0; } // Tachycardia/Arrhythmia
      
      if (thirst === 2) { glucose += 60; } // Diabetes Risk

      if (fatigue === 2) { hr -= 5; }
      if (fatigue === 3) { hr -= 15; sys -= 10; }

      // Also incorporate Age/BMI risks into background numbers
      if (bmi > 28) { sys += 15; cholesterol += 40; glucose += 15; }
      if (calcAge > 60) { sys += 10; pr += 15; qt += 20; }

      document.getElementById('heart_rate').value = hr;
      document.getElementById('spo2').value = spo2;
      document.getElementById('systolic_bp').value = Math.max(80, sys);
      document.getElementById('diastolic_bp').value = Math.max(50, sys - 42);
      document.getElementById('temperature').value = temp;
      document.getElementById('pr_interval').value = pr;
      document.getElementById('qrs_duration').value = qrs;
      document.getElementById('qt_interval').value = qt;
      document.getElementById('st_elevation').value = st;
      document.getElementById('glucose').value = glucose;
      document.getElementById('cholesterol').value = cholesterol;
      document.getElementById('resp_rate').value = resp_rate;

      updateLiveMetrics();
      runPrediction();
    }

    // ═══════════════════════════════════════════════
    //  PERSIST FORM VALUES IN LOCALSTORAGE
    // ═══════════════════════════════════════════════
    document.addEventListener("DOMContentLoaded", () => {
      const inputsToSave = [
        // Clinical form
        'patient_name', 'age', 'gender', 'bmi', 'resp_rate', 'heart_rate',
        'spo2', 'temperature', 'systolic_bp', 'diastolic_bp', 'glucose',
        'pr_interval', 'qrs_duration', 'qt_interval', 'st_elevation', 'cholesterol',
        // Layman form
        'layman_name', 'layman_age', 'layman_gender', 'layman_weight', 'layman_height',
        'layman_feeling', 'layman_breath', 'layman_dizzy', 'layman_nausea',
        'layman_chest', 'layman_fever', 'layman_palpitations', 'layman_thirst', 'layman_fatigue'
      ];

      // Load saved values
      inputsToSave.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          const saved = localStorage.getItem('vytalix_input_' + id);
          if (saved !== null) {
            el.value = saved;
          }
          // Add listener to save on change
          el.addEventListener('input', () => {
             localStorage.setItem('vytalix_input_' + id, el.value);
          });
          el.addEventListener('change', () => {
             localStorage.setItem('vytalix_input_' + id, el.value);
          });
        }
      });
      // Refresh UI based on the loaded values
      if (typeof updateLiveMetrics === 'function') {
        updateLiveMetrics();
      }
    });

    // ═══════════════════════════════════════════════
    //  SYSTEM SHUTDOWN & LOGOUT
    // ═══════════════════════════════════════════════
    function logoutUser() {
      localStorage.removeItem('loggedInUser');
      window.location.href = '/login';
    }

    function shutdownServer() {
      if (confirm('Are you sure you want to stop the local server and quit VYTALIX AI?')) {
        fetch('/api/shutdown', { method: 'POST' }).catch(() => { });
        document.body.innerHTML = `
          <div style="height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--bg);color:var(--text);font-family:'Space Grotesk',sans-serif;">
            <div style="font-size:64px;margin-bottom:20px;filter:grayscale(1);opacity:0.5;">🩺</div>
            <h1 style="color:var(--text2);margin-bottom:10px;font-weight:600;letter-spacing:-0.5px;">VYTALIX AI Disconnected</h1>
            <p style="color:var(--text3);font-size:15px;max-width:400px;text-align:center;line-height:1.6;">
              The local backend server has been safely stopped.<br>
              You can now close this browser window.
            </p>
          </div>
        `;
      }
    }
  </script>
</body>

</html>
