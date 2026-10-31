import React, { useState, useEffect } from 'react';
import {
  Database,
  GitBranch,
  TrendingUp,
  ShieldCheck,
  Sliders,
  Activity,
  Upload,
  RefreshCw,
  Sparkles,
  Zap,
  Info
} from 'lucide-react';

import CausalDAG from './components/CausalDAG';
import UpliftCharts from './components/UpliftCharts';
import OptimizationMatrix from './components/OptimizationMatrix';
import CausalAuditCard from './components/CausalAuditCard';
import DriftDetectorCard from './components/DriftDetectorCard';

const API_BASE = 'http://127.0.0.1:8000';

export default function App() {
  const [activeTab, setActiveTab] = useState('optimization');
  const [loading, setLoading] = useState(false);
  const [datasetStats, setDatasetStats] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [dmlSummary, setDmlSummary] = useState(null);
  const [upliftData, setUpliftData] = useState(null);
  const [auditData, setAuditData] = useState(null);
  const [optimizationData, setOptimizationData] = useState(null);
  const [driftData, setDriftData] = useState(null);
  const [executiveSummary, setExecutiveSummary] = useState(null);
  const [dmlModelType, setDmlModelType] = useState('linear_dml');

  // Initial load
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      // 1. Dataset
      const dsRes = await fetch(`${API_BASE}/api/dataset`);
      if (dsRes.ok) {
        const dsJson = await dsRes.json();
        setDatasetStats(dsJson);
      }

      // 2. Causal Graph
      const gRes = await fetch(`${API_BASE}/api/causal-graph`);
      if (gRes.ok) {
        const gJson = await gRes.json();
        setGraphData(gJson);
      }

      // 3. Train DML & get Uplift
      await trainDML('linear_dml');

      // 4. Default optimization
      await runOptimization({ total_budget: 5000, gross_margin_pct: 0.5, objective: 'conversions' });

      // 5. Drift
      const driftRes = await fetch(`${API_BASE}/api/drift-analysis`);
      if (driftRes.ok) {
        const dJson = await driftRes.json();
        setDriftData(dJson);
      }

      // 6. Summary
      const sumRes = await fetch(`${API_BASE}/api/executive-summary`);
      if (sumRes.ok) {
        const sJson = await sumRes.json();
        setExecutiveSummary(sJson);
      }
    } catch (err) {
      console.error('Failed to load initial data from API:', err);
    } finally {
      setLoading(false);
    }
  };

  const trainDML = async (modelType = dmlModelType) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/train-dml`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_type: modelType, n_folds: 3 })
      });
      if (res.ok) {
        const json = await res.json();
        setDmlSummary(json);
      }

      // Fetch updated uplift curves
      const upRes = await fetch(`${API_BASE}/api/uplift-curves`);
      if (upRes.ok) {
        const upJson = await upRes.json();
        setUpliftData(upJson);
      }
    } catch (err) {
      console.error('Failed training DML:', err);
    } finally {
      setLoading(false);
    }
  };

  const runAudit = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/causal-audit`, { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        setAuditData(json);
      }
    } catch (err) {
      console.error('Failed causal audit:', err);
    } finally {
      setLoading(false);
    }
  };

  const runOptimization = async (params) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/optimize-budget`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (res.ok) {
        const json = await res.json();
        setOptimizationData(json);
      }

      const sumRes = await fetch(`${API_BASE}/api/executive-summary`);
      if (sumRes.ok) {
        const sJson = await sumRes.json();
        setExecutiveSummary(sJson);
      }
    } catch (err) {
      console.error('Failed optimization:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/upload-dataset`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        alert('Dataset uploaded successfully! Re-running DML...');
        await fetchInitialData();
      } else {
        const err = await res.json();
        alert(`Error: ${err.detail}`);
      }
    } catch (err) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResetBenchmark = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/reset-benchmark?n_samples=3000`, { method: 'POST' });
      if (res.ok) {
        await fetchInitialData();
      }
    } catch (err) {
      console.error('Reset failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px 32px' }}>
      {/* Top Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>
              EconoCausal
            </h1>
            <span className="badge" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.4)' }}>
              Double ML Dynamic Pricing
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Prescriptive Promotional Optimization via EconML, DoWhy DAGs & SciPy
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
            Causal Engine Ready
          </div>
          <button onClick={handleResetBenchmark} disabled={loading} className="btn btn-secondary">
            <RefreshCw size={14} /> Regenerate Data
          </button>
        </div>
      </header>

      {/* Executive Callout Card */}
      {executiveSummary && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.4) 0%, rgba(17, 24, 39, 0.8) 100%)',
          border: '1px solid #1e40af',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <Sparkles size={26} style={{ color: '#60a5fa', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#93c5fd' }}>
              EXECUTIVE ROI SUMMARY
            </div>
            <div style={{ fontSize: '14px', color: '#f3f4f6', marginTop: '2px', lineHeight: '1.5' }}>
              {executiveSummary.narrative}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'optimization' ? 'active' : ''}`}
          onClick={() => setActiveTab('optimization')}
        >
          <Sliders size={16} /> Prescriptive Optimization
        </button>

        <button
          className={`tab-btn ${activeTab === 'uplift' ? 'active' : ''}`}
          onClick={() => setActiveTab('uplift')}
        >
          <TrendingUp size={16} /> Double ML & Uplift Curves
        </button>

        <button
          className={`tab-btn ${activeTab === 'dag' ? 'active' : ''}`}
          onClick={() => setActiveTab('dag')}
        >
          <GitBranch size={16} /> Causal Graph (DAG)
        </button>

        <button
          className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          <ShieldCheck size={16} /> Causal Audit (DoWhy)
        </button>

        <button
          className={`tab-btn ${activeTab === 'drift' ? 'active' : ''}`}
          onClick={() => setActiveTab('drift')}
        >
          <Activity size={16} /> Drift Monitor
        </button>

        <button
          className={`tab-btn ${activeTab === 'dataset' ? 'active' : ''}`}
          onClick={() => setActiveTab('dataset')}
        >
          <Database size={16} /> Dataset & Confounders
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'optimization' && (
        <OptimizationMatrix
          optimizationData={optimizationData}
          onRunOptimization={runOptimization}
          loading={loading}
        />
      )}

      {activeTab === 'uplift' && (
        <div>
          {/* DML Model Controls */}
          <div className="card" style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600' }}>EconML Double Machine Learning Engine</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Orthogonalizes confounders using LightGBM nuisance models to isolate pure treatment effect (ITE).
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <select
                value={dmlModelType}
                onChange={(e) => {
                  setDmlModelType(e.target.value);
                  trainDML(e.target.value);
                }}
                style={{ height: '36px' }}
              >
                <option value="linear_dml">EconML LinearDML (Interaction-based)</option>
                <option value="causal_forest">EconML CausalForestDML (Non-parametric)</option>
              </select>

              <button
                onClick={() => trainDML(dmlModelType)}
                disabled={loading}
                className="btn btn-primary"
                style={{ height: '36px' }}
              >
                {loading ? 'Re-training DML...' : 'Re-fit Double ML'}
              </button>
            </div>
          </div>

          <UpliftCharts upliftData={upliftData} iteSummary={dmlSummary?.ite_summary} />
        </div>
      )}

      {activeTab === 'dag' && <CausalDAG graphData={graphData} />}

      {activeTab === 'audit' && (
        <CausalAuditCard
          auditData={auditData}
          onRunAudit={runAudit}
          loading={loading}
        />
      )}

      {activeTab === 'drift' && (
        <DriftDetectorCard
          driftData={driftData}
          onRefreshDrift={async () => {
            setLoading(true);
            const res = await fetch(`${API_BASE}/api/drift-analysis`);
            if (res.ok) setDriftData(await res.json());
            setLoading(false);
          }}
          loading={loading}
        />
      )}

      {activeTab === 'dataset' && datasetStats && (
        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Upload and Dataset Info */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Historical Campaign Dataset</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Observational retail data containing confounders, past promotions, and purchase outcomes.
                </p>
              </div>

              <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
                <Upload size={16} /> Upload Custom Campaign CSV
                <input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '20px' }}>
              <div className="metric-card">
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Customer Records</span>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', marginTop: '4px' }}>
                  {datasetStats.stats.total_records.toLocaleString()}
                </div>
              </div>
              <div className="metric-card">
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Avg Income</span>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#38bdf8', marginTop: '4px' }}>
                  ${datasetStats.stats.avg_income_k}k
                </div>
              </div>
              <div className="metric-card">
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Avg Loyalty Score</span>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b', marginTop: '4px' }}>
                  {datasetStats.stats.avg_loyalty} / 100
                </div>
              </div>
              <div className="metric-card">
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Baseline Conversion Rate</span>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981', marginTop: '4px' }}>
                  {datasetStats.stats.overall_conversion_rate}%
                </div>
              </div>
            </div>
          </div>

          {/* Sample Table */}
          <div className="card">
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Sample Observational Records</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    {datasetStats.stats.columns.slice(0, 9).map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {datasetStats.sample_records.slice(0, 15).map((row, i) => (
                    <tr key={i}>
                      {datasetStats.stats.columns.slice(0, 9).map((col) => (
                        <td key={col} style={{ fontFamily: typeof row[col] === 'number' ? 'var(--font-mono)' : 'inherit' }}>
                          {row[col]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
