import React from 'react';
import { Activity, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

export default function DriftDetectorCard({ driftData, onRefreshDrift, loading }) {
  if (!driftData) return null;

  return (
    <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity style={{ color: '#8b5cf6' }} size={24} />
              Automated Customer Behavior Drift Monitor
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
              Monitors Population Stability Index (PSI) and Kolmogorov-Smirnov (KS) tests to alert when customer behavior shifts.
            </p>
          </div>

          <button
            onClick={onRefreshDrift}
            disabled={loading}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Evaluating Drift...' : 'Re-scan Feature Shift'}
          </button>
        </div>

        {/* Drift Status Banner */}
        <div style={{
          marginTop: '20px',
          backgroundColor: driftData.overall_drift_detected ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
          border: `1px solid ${driftData.overall_drift_detected ? '#ef4444' : '#10b981'}`,
          borderRadius: '10px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          {driftData.overall_drift_detected ? (
            <AlertTriangle size={28} style={{ color: '#ef4444', flexShrink: 0 }} />
          ) : (
            <CheckCircle size={28} style={{ color: '#10b981', flexShrink: 0 }} />
          )}
          <div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>
              {driftData.overall_drift_detected ? 'Behavior Drift Detected Across Confounders' : 'Customer Population Distributions Stable'}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {driftData.recommendation}
            </div>
          </div>
        </div>

        {/* Feature Shift Table */}
        <div style={{ marginTop: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Confounder & Covariate Shift Telemetry</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Customer Feature</th>
                  <th>KS Statistic</th>
                  <th>KS p-value</th>
                  <th>Population Stability Index (PSI)</th>
                  <th>Distribution Status</th>
                </tr>
              </thead>
              <tbody>
                {driftData.feature_metrics.map((m) => (
                  <tr key={m.feature}>
                    <td style={{ fontWeight: '500', fontFamily: 'var(--font-mono)' }}>{m.feature}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{m.ks_statistic}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: m.p_value < 0.05 ? '#f87171' : 'var(--text-muted)' }}>
                      {m.p_value}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: m.psi_score > 0.2 ? '#f87171' : m.psi_score > 0.1 ? '#fbbf24' : '#34d399' }}>
                      {m.psi_score}
                    </td>
                    <td>
                      <span className="badge" style={{
                        backgroundColor: m.psi_score > 0.2 ? 'rgba(239, 68, 68, 0.15)' : m.psi_score > 0.1 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: m.psi_score > 0.2 ? '#f87171' : m.psi_score > 0.1 ? '#fbbf24' : '#34d399'
                      }}>
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
