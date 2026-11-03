# Presentation & Viva Defense Outline
## Project: EconoCausal — Dynamic Pricing via Double Machine Learning
**Candidate:** Shivanurag Yayavaram (Data Associate L1. Intern)  
**Organization:** Infotact Solutions  

---

### Slide 1: Title & Introduction
- **Project Title:** EconoCausal: Dynamic Pricing via Double Machine Learning
- **Domain:** Causal AI, Microeconomics, Prescriptive Optimization
- **Problem:** Why traditional predictive models fail in pricing and churn prevention ($P(Y \mid X)$ vs $P(Y \mid do(T))$).

### Slide 2: The Core Intuition — Customer Archetypes
- **Persuadables:** Will buy *only if* they receive a discount. (Target here!)
- **Sure Things:** Will buy regardless. Discounts here are pure margin loss.
- **Lost Causes:** Won't buy even with a discount. Discounts here are wasted.
- **Sleeping Dogs:** Discounts may trigger negative reactions or devalue brand perception.

### Slide 3: The Causal Inference Engine
- Directed Acyclic Graphs (DAG) via Microsoft DoWhy.
- Identifying Confounders (Income, Loyalty, Recency, Visit Frequency) causing Selection Bias.
- Backdoor criterion proof for unconfoundedness.

### Slide 4: Double Machine Learning (DML) Formulation
- Chernozhukov et al. (2018) Debiased ML framework.
- Stage 1: Orthogonalization of outcome and treatment using LightGBM nuisance models with $K$-fold cross-fitting.
- Stage 2: Residual regression isolating Individual Treatment Effect (ITE).

### Slide 5: The Causal Audit (DoWhy Refutations)
- **Placebo Treatment Test:** Proving estimated effect drops to zero under random treatment permutations ($p > 0.95$).
- **Random Common Cause Test:** Proving invariance to unobserved noise variables.
- **Data Subset Stability:** Proving stability across $85\%$ random customer subsamples.

### Slide 6: Prescriptive Optimization (SciPy MILP)
- Formulating the Multi-Choice Knapsack problem.
- Hard marketing budget constraint ($\sum \text{Cost} \le \text{Budget}$).
- Allocation matrix generating optimal personalized discounts ($0, $10, $20).

### Slide 7: Uplift Metrics & Qini Curves
- Demonstrating the Qini Curve using Plotly.js.
- Causal DML achieves $+1.145$ Qini score vs $-0.001$ for naive churn/propensity models ($+114.7\%$ efficiency advantage).

### Slide 8: Production Architecture & Drift Monitoring
- REST API using FastAPI.
- Real-time customer behavioral shift detection using Population Stability Index (PSI) and Kolmogorov-Smirnov tests.
- React + Plotly interactive UI for marketing and finance executives.

### Slide 9: Viva Q&A Cheat Sheet
- **Q: Why can't we just use Logistic Regression with an interaction term $(T \times X)$?**  
  *A:* Standard parametric interaction terms suffer from severe regularization bias in high dimensions and fail when the true relationship is non-linear. DML provides $\sqrt{N}$-consistent, asymptotically normal causal estimates even with flexible gradient boosted trees.
- **Q: How does DML prevent overfitting in nuisance estimators?**  
  *A:* Cross-fitting (sample splitting) ensures that predictions for nuisance residuals in fold $k$ are generated using models trained strictly on out-of-fold data.
