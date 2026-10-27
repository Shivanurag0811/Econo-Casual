import React, { useState } from 'react';
import { Sliders, DollarSign, Users, TrendingUp, CheckCircle, Search, Filter } from 'lucide-react';

export default function OptimizationMatrix({
  optimizationData,
  onRunOptimization,
  loading
}) {
  const [budget, setBudget] = useState(5000);
  const [margin, setMargin] = useState(50);
  const [objective, setObjective] = useState('conversions');
  const [searchTerm, setSearchTerm] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('ALL');

  const handleOptimize = () => {
    onRunOptimization({
      total_budget: Number(budget),
      gross_margin_pct: Number(margin) / 100,
      objective: objective
    });
  };

  const prescriptions = optimizationData?.prescriptions || [];
  const filteredPrescriptions = prescriptions.filter((p) => {
    const matchesSearch = p.customer_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSegment = segmentFilter === 'ALL' || p.causal_segment === segmentFilter;
    return matchesSearch && matchesSegment;
  });

  return (
    <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Control Box */}
      <div className="card">
        <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Sliders size={20} style={{ color: '#3b82f6' }} />
          Prescriptive SciPy Optimization Settings
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Promotional Budget: <strong style={{ color: '#60a5fa' }}>${Number(budget).toLocaleString()}</strong>
            </label>
            <input
              type="range"
              min="1000"
              max="30000"
              step="500"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
              <span>$1,000</span>
              <span>$15,000</span>
              <span>$30,000</span>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Product Gross Margin (%): <strong style={{ color: '#34d399' }}>{margin}%</strong>
            </label>
            <input
              type="range"
              min="20"
              max="80"
              step="5"
              value={margin}
              onChange={(e) => setMargin(e.target.value)}
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
              <span>20%</span>
              <span>50%</span>
              <span>80%</span>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Optimization Objective:
            </label>
            <select
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              style={{ width: '100%', height: '38px' }}
            >
              <option value="conversions">Maximize Incremental Revenue (Causal Lift)</option>
              <option value="profit">Strict Net Profit Maximization</option>
            </select>
          </div>

          <div>
            <button
              onClick={handleOptimize}
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', height: '38px', justifyContent: 'center' }}
            >
              {loading ? 'Solving MILP...' : '⚡ Solve Optimal Policy'}
            </button>
          </div>
        </div>
      </div>

      {/* Optimization Results & ROI Summary */}
      {optimizationData && (
        <>
          <div style={{
            background: 'linear-gradient(90deg, #1e3a8a 0%, #172554 100%)',
            border: '1px solid #3b82f6',
            borderRadius: '12px',
            padding: '18px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <CheckCircle size={32} style={{ color: '#60a5fa', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>
                {optimizationData.executive_summary}
              </div>
              <div style={{ fontSize: '13px', color: '#bfdbfe', marginTop: '4px' }}>
                Status: {optimizationData.status} • Total Spend: ${optimizationData.total_allocated_spend.toLocaleString()} • Remaining Budget: ${optimizationData.remaining_budget.toLocaleString()}
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="metric-card">
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Persuadables Targeted</span>
              <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#38bdf8', marginTop: '4px' }}>
                {optimizationData.total_customers_targeted.toLocaleString()}
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                of {optimizationData.total_customers_evaluated.toLocaleString()} customers
              </span>
            </div>

            <div className="metric-card">
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Expected Incremental Revenue</span>
              <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#34d399', marginTop: '4px' }}>
                ${optimizationData.expected_incremental_revenue.toLocaleString()}
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                +{optimizationData.expected_incremental_conversions} incremental orders
              </span>
            </div>

            <div className="metric-card">
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Saved vs Blanket Rollout</span>
              <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#f59e0b', marginTop: '4px' }}>
                +${optimizationData.benchmark_comparisons.value_added_over_blanket.toLocaleString()}
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Zero discount waste on Sure Things
              </span>
            </div>

            <div className="metric-card">
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Advantage vs Churn ML</span>
              <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#a78bfa', marginTop: '4px' }}>
                +${optimizationData.benchmark_comparisons.value_added_over_predictive_ml.toLocaleString()}
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                True causal uplift attribution
              </span>
            </div>
          </div>

          {/* Allocation Matrix Table */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Customer Prescription Matrix</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Mathematically assigned discount tier ($0, $10, $20) and individual causal uplift score.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Search Customer ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ paddingLeft: '32px', width: '180px' }}
                  />
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-muted)' }} />
                </div>

                <select
                  value={segmentFilter}
                  onChange={(e) => setSegmentFilter(e.target.value)}
                  style={{ width: '160px' }}
                >
                  <option value="ALL">All Segments</option>
                  <option value="Persuadables">Persuadables Only</option>
                  <option value="Sure Things">Sure Things</option>
                  <option value="Lost Causes">Lost Causes</option>
                  <option value="Sleeping Dogs">Sleeping Dogs</option>
                </select>
              </div>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Customer ID</th>
                    <th>Age</th>
                    <th>Income ($k)</th>
                    <th>Loyalty Score</th>
                    <th>Monthly Visits</th>
                    <th>Recency (Days)</th>
                    <th>Causal Segment</th>
                    <th>Prescribed Discount</th>
                    <th>Expected Uplift (ΔP)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPrescriptions.map((row) => {
                    const badgeClass =
                      row.causal_segment === 'Persuadables' ? 'badge-persuadable' :
                      row.causal_segment === 'Sure Things' ? 'badge-sure-thing' :
                      row.causal_segment === 'Sleeping Dogs' ? 'badge-sleeping-dog' : 'badge-lost-cause';

                    const isTargeted = row.prescribed_discount > 0;

                    return (
                      <tr key={row.customer_id} style={{ backgroundColor: isTargeted ? 'rgba(59, 130, 246, 0.04)' : undefined }}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>{row.customer_id}</td>
                        <td>{row.age}</td>
                        <td>${row.income_k}k</td>
                        <td>{row.loyalty_score}</td>
                        <td>{row.visits_per_month}</td>
                        <td>{row.recency_days}d</td>
                        <td>
                          <span className={`badge ${badgeClass}`}>
                            {row.causal_segment}
                          </span>
                        </td>
                        <td>
                          {row.prescribed_discount > 0 ? (
                            <span style={{
                              fontWeight: 'bold',
                              color: '#34d399',
                              backgroundColor: 'rgba(16, 185, 129, 0.15)',
                              padding: '4px 10px',
                              borderRadius: '6px'
                            }}>
                              ${row.prescribed_discount} OFF
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>$0 (No Promo)</span>
                          )}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: row.expected_uplift > 0 ? '#38bdf8' : 'var(--text-muted)' }}>
                          {row.expected_uplift > 0 ? `+${(row.expected_uplift * 100).toFixed(1)}%` : '0.0%'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '10px', textAlign: 'right' }}>
              Showing {filteredPrescriptions.length} customer prescriptions (sorted by allocation priority)
            </div>
          </div>
        </>
      )}
    </div>
  );
}
