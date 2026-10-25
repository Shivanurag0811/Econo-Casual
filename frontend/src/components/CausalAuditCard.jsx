import React from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

export default function CausalAuditCard({ auditData, onRunAudit, loading }) {
  return (
    <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck style={{ color: '#10b981' }} size={24} />
              Causal Audit & Invariance Refutation Tests (DoWhy)
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
              Mathematically audits whether the causal pricing model has successfully isolated true causality from hidden confounders.
            </p>
          </div>

          <button
            onClick={onRunAudit}
            disabled={loading}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Running DoWhy Refutations...' : 'Run Causal Audit Suite'}
          </button>
        </div>

        {auditData ? (
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Overall Status Banner */}
            <div style={{
              backgroundColor: auditData.overall_audit_passed ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
              border: `1px solid ${auditData.overall_audit_passed ? '#10b981' : '#f59e0b'}`,
              borderRadius: '10px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px'
            }}>
              {auditData.overall_audit_passed ? (
                <CheckCircle size={28} style={{ color: '#10b981', flexShrink: 0 }} />
              ) : (
                <AlertTriangle size={28} style={{ color: '#f59e0b', flexShrink: 0 }} />
              )}
              <div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>
                  {auditData.overall_audit_passed ? 'All Causal Refutation Tests Passed' : 'Audit Finished with Warnings'}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {auditData.summary} (Baseline Backdoor Effect: <strong style={{ color: '#38bdf8' }}>{auditData.baseline_causal_effect}</strong>)
                </div>
              </div>
            </div>

            {/* Individual Tests Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              {auditData.tests.map((t, idx) => (
                <div key={idx} className="metric-card" style={{
                  borderTop: `4px solid ${t.passed ? '#10b981' : '#f59e0b'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '15px' }}>{t.test_name}</span>
                      <span className="badge" style={{
                        backgroundColor: t.passed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: t.passed ? '#34d399' : '#f87171'
                      }}>
                        {t.passed ? 'CERTIFIED' : 'FAILED'}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.4' }}>
                      {t.description}
                    </p>
                  </div>

                  <div style={{ marginTop: '16px', borderTop: '1px solid #1e293b', paddingTop: '12px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Original Estimated Effect:</span>
                      <strong style={{ fontFamily: 'var(--font-mono)' }}>{t.original_effect}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Refuted / Simulated Effect:</span>
                      <strong style={{ fontFamily: 'var(--font-mono)', color: t.passed ? '#34d399' : '#f87171' }}>
                        {t.refuted_effect}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Verification Status:</span>
                      <span style={{ color: t.passed ? '#34d399' : '#f59e0b', fontWeight: '500' }}>{t.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Click "Run Causal Audit Suite" to execute DoWhy refutation simulations and verify unconfoundedness.
          </div>
        )}
      </div>
    </div>
  );
}
