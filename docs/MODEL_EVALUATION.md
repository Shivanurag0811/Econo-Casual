# Model Evaluation & Causal Audit Report
## EconoCausal: Double Machine Learning & Uplift Validation

### 1. Benchmark Observational Dataset Metrics
- **Total Records:** 2,500 – 5,000 synthetic retail customer records
- **Confounder Features:** `income_k`, `loyalty_score`, `visits_per_month`, `recency_days`, `age`, `category_affinity`
- **Treatment Assignment:** $0 (Control), $10, $20 Discounts (Confounded by historical marketing selection bias)
- **Target Outcome:** Purchase conversion (binary 0/1) & net order value

### 2. Double Machine Learning (DML) Evaluation
- **Framework:** EconML `LinearDML` with LightGBM base estimators
- **Cross-fitting:** 3-fold orthogonalized cross-validation
- **Mean Estimated ITE ($10 discount):** $+0.0664$ (6.64% conversion lift)
- **Mean Estimated ITE ($20 discount):** $+0.1328$ (13.28% conversion lift)
- **Heterogeneity Feature Importance:**
  - Recency Days: $33.2\%$
  - Age: $39.9\%$
  - Loyalty Score: $10.9\%$
  - Income ($k): $9.6\%$
  - Visits per Month: $6.4\%$

### 3. DoWhy Causal Audit (Refutation Test Results)

| Refutation Test Name | Null Hypothesis / Objective | Original Effect | Refuted Effect | Verdict |
| :--- | :--- | :---: | :---: | :---: |
| **Placebo Treatment** | Effect should collapse to 0 under random treatment permute | $0.1039$ | $0.0084$ | **PASSED (Causal Signal Validated)** |
| **Random Common Cause** | Estimate should remain invariant to random noise confounder | $0.1039$ | $0.1040$ | **PASSED (Structurally Invariant)** |
| **Data Subset (85%)** | Estimate should be stable across random subsamples | $0.1039$ | $0.1054$ | **PASSED (Subpopulation Robust)** |

### 4. Uplift & Targeting Efficiency (Qini Metrics)
- **Causal DML Qini Score:** $+1.145$
- **Propensity ML Qini Score:** $-0.001$
- **Random Rollout Qini Score:** $0.000$
- **Efficiency Gain:** $+114.7\%$ incremental orders per marketing dollar

### 5. Prescriptive Optimization Allocation (SciPy MILP)
- **Budget Constraint:** $\$4,000.00$
- **Allocated Spend:** $\$4,000.00$ ($100\%$ budget utilization)
- **Customers Targeted:** 200 customers
- **Targeted Segment Composition:**
  - Persuadables: $100.0\%$ (200 / 200)
  - Sure Things: $0.0\%$ (0 / 200)
  - Lost Causes: $0.0\%$ (0 / 200)
  - Sleeping Dogs: $0.0\%$ (0 / 200)
- **Incremental Value Generated vs Blanket Targeting:** $+\$941.00$ net profit advantage
