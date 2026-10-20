import React from 'react';
import { GitBranch, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';

export default function CausalDAG({ graphData }) {
  if (!graphData) return null;

  return (
    <div className="card" style={{ marginTop: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GitBranch style={{ color: '#3b82f6' }} size={22} />
            Causal Directed Acyclic Graph (DAG) & Identification
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Identifies Confounders, Selection Bias, and Backdoor Unconfoundedness Condition.
          </p>
        </div>
        <span className="badge" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
          DoWhy Backdoor Identifiable
        </span>
      </div>

      {/* Visual DAG Representation */}
      <div style={{
        backgroundColor: '#0d131f',
        borderRadius: '10px',
        padding: '24px',
        border: '1px solid #1e293b',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        alignItems: 'center'
      }}>
        {/* Top: Confounders (W) */}
        <div style={{ textAlign: 'center', width: '100%' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', color: '#f59e0b', marginBottom: '8px' }}>
            Confounders / Common Causes (W)
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
            {graphData.confounders.map((c) => (
              <div key={c} style={{
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                color: '#fbbf24',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '500'
              }}>
                {c.replace('_', ' ')}
              </div>
            ))}
          </div>
        </div>

        {/* Middle arrows */}
        <div style={{ display: 'flex', justifyContent: 'space-around', width: '70%', color: 'var(--text-muted)', fontSize: '12px' }}>
          <div>↙ Causes Treatment (Selection Bias)</div>
          <div>Causes Purchase Direct ↘</div>
        </div>

        {/* Bottom: Treatment (T) -> Outcome (Y) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', justifyContent: 'center', width: '100%' }}>
          <div style={{
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            border: '2px solid #3b82f6',
            color: '#93c5fd',
            padding: '14px 20px',
            borderRadius: '10px',
            textAlign: 'center',
            minWidth: '180px'
          }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold', color: '#60a5fa' }}>Treatment (T)</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', marginTop: '4px' }}>Discount Offered</div>
            <div style={{ fontSize: '12px', color: '#93c5fd' }}>$0, $10, $20</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#10b981' }}>True Causal Uplift (ITE)</span>
            <ArrowRight size={28} style={{ color: '#10b981' }} />
          </div>

          <div style={{
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '2px solid #10b981',
            color: '#6ee7b7',
            padding: '14px 20px',
            borderRadius: '10px',
            textAlign: 'center',
            minWidth: '180px'
          }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold', color: '#34d399' }}>Outcome (Y)</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', marginTop: '4px' }}>Purchase Conversion</div>
            <div style={{ fontSize: '12px', color: '#a7f3d0' }}>Binary 0 / 1 & Order Value</div>
          </div>
        </div>
      </div>

      {/* Econometric Identification Note */}
      <div style={{
        marginTop: '16px',
        padding: '14px 18px',
        backgroundColor: '#111827',
        borderRadius: '8px',
        borderLeft: '4px solid #3b82f6',
        fontSize: '13px',
        color: 'var(--text-secondary)'
      }}>
        <strong style={{ color: '#fff' }}>Backdoor Criterion Identification:</strong> By conditioning on confounders 
        <code style={{ color: '#fbbf24', marginLeft: '6px' }}>W = [income_k, loyalty_score, visits_per_month, recency_days]</code>, 
        all spurious backdoor paths between <em>Discount Offered</em> and <em>Conversion</em> are blocked: 
        <span style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8', marginLeft: '6px' }}>
          P(Y | do(T=t)) = Σ_w P(Y | T=t, W=w) · P(W=w)
        </span>.
      </div>
    </div>
  );
}
