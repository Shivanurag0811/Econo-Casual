import React, { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';
import { TrendingUp, Award, Zap } from 'lucide-react';

export default function UpliftCharts({ upliftData, iteSummary }) {
  const qiniChartRef = useRef(null);
  const iteChartRef = useRef(null);

  useEffect(() => {
    if (!upliftData || !qiniChartRef.current) return;

    // 1. Qini & Uplift Curve
    const traceCausal = {
      x: upliftData.percentiles,
      y: upliftData.causal_dml_curve,
      mode: 'lines+markers',
      name: 'EconML Causal DML (Target by ITE)',
      line: { color: '#10b981', width: 3 },
      marker: { size: 6 }
    };

    const tracePredictive = {
      x: upliftData.percentiles,
      y: upliftData.predictive_ml_curve,
      mode: 'lines',
      name: 'Traditional ML (Target by Churn/Propensity)',
      line: { color: '#f59e0b', width: 2, dash: 'dash' }
    };

    const traceRandom = {
      x: upliftData.percentiles,
      y: upliftData.random_curve,
      mode: 'lines',
      name: 'Random Rollout Baseline',
      line: { color: '#6b7280', width: 2, dash: 'dot' }
    };

    const layout = {
      title: {
        text: 'Cumulative Uplift & Qini Curve: Causal DML vs Traditional Rollouts',
        font: { color: '#f3f4f6', size: 16 }
      },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: '#111827',
      xaxis: {
        title: 'Percentage of Customer Population Targeted (%)',
        color: '#9ca3af',
        gridcolor: '#1f2937',
        zerolinecolor: '#374151'
      },
      yaxis: {
        title: 'Cumulative Incremental Conversions',
        color: '#9ca3af',
        gridcolor: '#1f2937',
        zerolinecolor: '#374151'
      },
      legend: {
        x: 0.05,
        y: 0.95,
        font: { color: '#e5e7eb' },
        bgcolor: 'rgba(17, 24, 39, 0.8)'
      },
      margin: { l: 60, r: 30, t: 50, b: 50 },
      autosize: true
    };

    Plotly.react(qiniChartRef.current, [traceCausal, tracePredictive, traceRandom], layout, { responsive: true, displayModeBar: false });

  }, [upliftData]);

  if (!upliftData) return null;

  return (
    <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Metric Callouts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
        <div className="metric-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Qini Score (Causal DML)</span>
            <Award size={18} style={{ color: '#10b981' }} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981', marginTop: '6px' }}>
            +{upliftData.qini_score_causal}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Area under causal uplift curve above random
          </div>
        </div>

        <div className="metric-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Traditional ML Qini</span>
            <TrendingUp size={18} style={{ color: '#f59e0b' }} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b', marginTop: '6px' }}>
            +{upliftData.qini_score_predictive}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Propensity targeting (diluted by Sure Things)
          </div>
        </div>

        <div className="metric-card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Efficiency Advantage</span>
            <Zap size={18} style={{ color: '#3b82f6' }} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#60a5fa', marginTop: '6px' }}>
            +{upliftData.efficiency_gain_pct}%
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Incremental conversion lift per dollar
          </div>
        </div>
      </div>

      {/* Plotly Chart Container */}
      <div className="card">
        <div ref={qiniChartRef} style={{ width: '100%', height: '420px' }} />
        <div style={{
          marginTop: '12px',
          padding: '12px 16px',
          backgroundColor: '#111827',
          borderRadius: '8px',
          fontSize: '13px',
          color: '#cbd5e1'
        }}>
          💡 <strong>Interpretation:</strong> The steep initial slope of the Green Causal curve confirms that prioritizing 
          customers by Double ML Individual Treatment Effect (ITE) extracts maximum incremental conversions at lower targeting depths, 
          avoiding the wasted discount margin of correlation-based models.
        </div>
      </div>
    </div>
  );
}
