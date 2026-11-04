# EconoCausal: Dynamic Pricing via Double Machine Learning
## Comprehensive Project Report & System Architecture
**Domain:** Economics, Causal AI & Prescriptive Analytics  
**Organization:** Infotact Solutions  
**Author:** Shivanurag Yayavaram (Data Associate L1. Intern)  

---

### 1. Executive Summary

Standard machine learning models predict correlation rather than causation: $P(\text{Outcome} \mid \text{Feature})$. In promotional campaigns, a predictive model might suggest offering discounts to users with high purchase intent. However, these customers are often **"Sure Things"** who would have purchased anyway, leading to significant margin cannibalization. Conversely, discounts given to **"Lost Causes"** fail to stimulate conversions.

**EconoCausal** is an enterprise-grade Causal AI and Prescriptive Optimization platform. By combining **Microsoft DoWhy Directed Acyclic Graphs (DAGs)**, **EconML Double/Debiased Machine Learning (DML)**, and **SciPy Mixed Integer Linear Programming (MILP)**, EconoCausal isolates the true **Individual Treatment Effect (ITE)** and allocates marketing budgets strictly to **"Persuadables"**—customers whose purchase decisions are directly catalyzed by the promotion.

---

### 2. Theoretical Framework & Methodology

#### 2.1 Causal DAG & The Backdoor Criterion
Observational campaign datasets suffer from selection bias because historical promotions were selectively offered to high-value or highly active customers.

```
       [ Confounders (W) ]
       /                 \
      v                   v
[ Discount (T) ] ----> [ Conversion (Y) ]
```

- **Confounders ($W$):** `income_k`, `loyalty_score`, `visits_per_month`, `recency_days`.
- **Treatment ($T$):** Discount tier ($0, $10, $20).
- **Outcome ($Y$):** Conversion probability and order basket value.

Under Pearl's Backdoor Criterion, conditioning on $W$ blocks all spurious non-causal paths, satisfying unconfoundedness:
$$P(Y \mid do(T=t)) = \sum_{w} P(Y \mid T=t, W=w) P(W=w)$$

#### 2.2 Double / Debiased Machine Learning (DML)
Following Chernozhukov et al. (2018), standard regression suffers from regularization and estimation bias when complex non-linear ML models (e.g. LightGBM, Random Forests) are used. EconoCausal utilizes **Neyman Orthogonalization** with $K$-fold cross-fitting:

1. **Outcome Nuisance Model:** Estimate $\hat{q}(X, W) = E[Y \mid X, W]$ using LightGBM. Compute residual $\tilde{Y} = Y - \hat{q}(X, W)$.
2. **Treatment Nuisance Model:** Estimate $\hat{m}(X, W) = E[T \mid X, W]$ using LightGBM. Compute residual $\tilde{T} = T - \hat{m}(X, W)$.
3. **Causal Stage:** Regress orthogonalized residual $\tilde{Y}$ onto $\tilde{T} \cdot X$ to estimate unconfounded heterogeneous treatment effects:
$$\tilde{Y} = \theta(X) \cdot \tilde{T} + \epsilon, \quad E[\epsilon \mid X, W] = 0$$

#### 2.3 Mathematical Refutation Tests (Causal Audit)
To prove that confounding bias has been removed, DoWhy refutation tests are conducted:
1. **Placebo Treatment Test:** Permutes treatment assignments randomly. The estimated effect collapses from $+0.1039$ to $0.0084 \approx 0$ ($p > 0.95$), proving the effect is not an artifact of model structure.
2. **Random Common Cause Test:** Injects an unobserved noise confounder. Causal estimate remains invariant ($0.1039 \to 0.1040$, $< 0.1\%$ variation).
3. **Data Subset Stability Test:** Re-estimates effect across $85\%$ random subsamples. Estimate remains stable ($0.1039 \to 0.1054$), verifying subpopulation robustness.

#### 2.4 Prescriptive Optimization via SciPy MILP
Given a fixed campaign budget $B$ (e.g., $\$5,000$), the marketing allocation is solved as a Multi-Choice Knapsack Integer Program:
$$\max_{\{x_{i, k}\}} \sum_{i=1}^N \sum_{k \in \{0, 10, 20\}} x_{i, k} \cdot \left( \text{ITE}_{i, k} \cdot \text{Basket}_i \right)$$
Subject to:
$$\sum_{i=1}^N \sum_{k} x_{i, k} \cdot \text{Cost}_k \le B$$
$$\sum_{k \in \{0, 10, 20\}} x_{i, k} = 1 \quad \forall i, \quad x_{i, k} \in \{0, 1\}$$

---

### 3. Empirical Results & Performance Benchmark

| Evaluation Metric | Traditional Predictive ML | Random Rollout | EconoCausal (DML + SciPy) | Advantage |
| :--- | :---: | :---: | :---: | :---: |
| **Qini Score** | $-0.001$ | $0.000$ | **$+1.145$** | **$\mathbf{> 100\%}$ lift** |
| **Persuadables Share in Spend** | $14.2\%$ | $24.8\%$ | **$100.0\%$** | **$+75.2\%$ precision** |
| **Waste on Sure Things** | High ($\approx 42\%$) | Medium ($\approx 25\%$) | **$0.0\%$ (Eliminated)** | **$100\%$ reduction** |
| **Net Incremental Profit (on \$4k budget)** | $-\$3,738$ | $-\$3,785$ | **$-\$2,078$** | **$+\$1,660$ value added** |

---

### 4. Technical Architecture

- **Backend:** Python 3.13, EconML, DoWhy, SciPy, LightGBM, Scikit-Learn, FastAPI, Uvicorn.
- **Frontend Dashboard:** React 19, Vite, Plotly.js, Lucide Icons, Modern Responsive Dark UI.
- **Monitoring & Drift:** Population Stability Index (PSI) and Kolmogorov-Smirnov 2-sample tests.
