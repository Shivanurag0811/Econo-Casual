# EconoCausal: Interactive Web Dashboard Walkthrough Script
**Project:** Dynamic Pricing & Promotional Allocation via Double Machine Learning  
**Presenter:** Shivanurag Yayavaram (Data Associate L1. Intern)  
**Target Audience:** Project Mentors, Technical Evaluators & Business Stakeholders  

---

## 🎬 Introduction & Project Hook (0:00 – 0:30)

> *"Good day everyone. Today I'm going to walk you through the live dashboard of **EconoCausal**, an enterprise Causal AI and Prescriptive Optimization platform built using Microsoft DoWhy, EconML, and SciPy.*
>
> *In traditional marketing, companies use predictive machine learning to predict churn or purchase likelihood. However, standard ML only predicts **correlation**, not **causation**. If a model predicts a user has an 80% likelihood to buy, offering them a \$20 discount often wastes budget on a **'Sure Thing'** who would have purchased anyway.*
>
> *EconoCausal moves beyond prediction into **counterfactual causation**: it calculates the **Individual Treatment Effect (ITE)** to answer: **'Will this customer buy IF AND ONLY IF we give them a discount?'***
>
> *Let's explore the dashboard and see how this works in real time."*

---

## 🖥️ Section 1: Prescriptive Optimization & Budget Allocation (0:30 – 1:30)
**[Tab: Prescriptive Optimization]**

### What to Click / Point To:
- The **Promotional Budget Slider** (\$1,000 to \$30,000)
- The **Optimization Objective** dropdown (Revenue vs Net Profit)
- The **Solve Optimal Policy** button
- The **KPI Cards** (Persuadables Targeted, Incremental Revenue, Value Saved)
- The **Prescription Matrix Table** below

### What to Say:
> *"We start on the primary executive view: **Prescriptive Optimization**.*
>
> *Here, a marketing or finance director can input their campaign constraints. For example, let's set our budget to **\$5,000** with an expected gross margin of **50%**.*
>
> *When we click **'Solve Optimal Policy'**, the backend runs a **SciPy Mixed Integer Linear Program (MILP)** solving a constrained Multi-Choice Knapsack problem.*
>
> *Notice the immediate business impact in our KPI cards:*
> 1. *Instead of blanket targeting or giving discounts to top spenders, the algorithm allocates **100% of the budget exclusively to Persuadables**—customers whose purchase is directly caused by the promotion.*
> 2. *The model generates an expected **\$3,800+ in incremental revenue**, while **saving over \$3,900** that traditional blanket targeting would have wasted on customers who didn't need a discount.*
>
> *Scrolling down, we see the **Customer Prescription Matrix**. For every individual customer, the solver assigns their mathematically optimal discount tier: **\$0, \$10, or \$20**, along with their predicted causal conversion uplift."*

---

## 📈 Section 2: Double ML & Uplift Curves (1:30 – 2:30)
**[Tab: Double ML & Uplift Curves]**

### What to Click / Point To:
- The **Model Type Selector** (`EconML LinearDML` vs `CausalForestDML`)
- The **Qini Score KPI Card** (`+1.145`)
- The interactive **Plotly Chart** (Green Causal Curve vs Yellow Traditional ML vs Gray Random)

### What to Say:
> *"Next, let's look at the causal machine learning engine powering these prescriptions under the **Double ML & Uplift Curves** tab.*
>
> *Observational retail data is always confounded: historically, wealthier or more loyal customers received higher discounts, creating severe **selection bias**. Standard regression confuses customer wealth with discount effectiveness.*
>
> *To fix this, we implement **Double/Debiased Machine Learning (DML)** based on Chernozhukov's Neyman Orthogonalization:*
> - *It uses 3-fold cross-fitting with LightGBM nuisance models to predict and residualize both the outcome and the treatment.*
> - *This strips away confounding bias and isolates the pure causal effect.*
>
> *In our Plotly visualization, look at the **Qini and Cumulative Uplift curves**:*
> - *The **Green Curve** is our Causal DML model.*
> - *The **Yellow Dashed Curve** is traditional predictive churn/propensity ML.*
> - *The **Gray Dotted Line** is a random campaign rollout.*
>
> *Notice how steep the causal curve rises: our model achieves a **Qini Score of +1.145**, delivering a **+114% efficiency advantage** over standard ML. It reaches maximum incremental conversions with a fraction of the budget."*

---

## 🕸️ Section 3: Causal Graph (DAG) & Identification (2:30 – 3:15)
**[Tab: Causal Graph (DAG)]**

### What to Click / Point To:
- The Confounders block ($W$: Income, Loyalty, Visits, Recency)
- The Selection Bias and Direct Effect arrows
- The Treatment ($T$) to Outcome ($Y$) causal link
- The **Backdoor Criterion** formula box

### What to Say:
> *"Under the **Causal Graph (DAG)** tab, we make our economic assumptions fully transparent using Microsoft's **DoWhy** library.*
>
> *Here we map out the Directed Acyclic Graph:*
> - *At the top are our **Confounders (W)**: customer income, loyalty score, visit frequency, and recency.*
> - *Notice the downward arrows: these confounders influence **both** the discount offered (selection bias) and the likelihood of purchase.*
> - *By formalizing this in DoWhy, we mathematically prove that conditioning on these confounders satisfies Pearl's **Backdoor Criterion**:*
>
> $$\text{All backdoor paths are blocked, proving } P(Y \mid do(T=t)) \text{ is identifiable.}"*$$

---

## 🛡️ Section 4: Causal Audit & Refutation Tests (3:15 – 4:00)
**[Tab: Causal Audit (DoWhy)]**

### What to Click / Point To:
- The **Run Causal Audit Suite** button
- The **All Causal Refutation Tests Passed** green banner
- The 3 Refutation Cards: Placebo Treatment, Random Common Cause, Data Subset Stability

### What to Say:
> *"Enterprise decision-makers require trust and explainability before rolling out dynamic pricing. Under the **Causal Audit** tab, we execute mathematical refutation stress tests to audit our causal model:*
>
> 1. ***Placebo Treatment Test:** We replace real discounts with random noise. If our model had captured spurious correlation, the effect would stay high. Instead, the effect collapses to zero (from 0.1039 to 0.0084, $p > 0.95$), proving true causality.*
> 2. ***Random Common Cause Test:** We inject an unobserved noise confounder. The estimate remains invariant ($< 0.1\%$ difference), proving graph structural stability.*
> 3. ***Data Subset Stability Test:** We re-estimate the effect across random 85% subsamples to prove the policy is robust across customer segments.*
>
> *All three tests pass with certified status."*

---

## 🚨 Section 5: Customer Behavior Drift Monitor (4:00 – 4:45)
**[Tab: Drift Monitor]**

### What to Click / Point To:
- The **Distribution Status Banner**
- The **Telemetry Table** showing KS-Statistic, p-value, and Population Stability Index (PSI)

### What to Say:
> *"In production dynamic pricing, customer behavior inevitably evolves due to inflation, seasonality, or competitor moves. Under the **Drift Monitor** tab, we built an automated telemetry system.*
>
> *Using two statistical benchmarks:*
> - ***Two-sample Kolmogorov-Smirnov (KS) tests***
> - ***Population Stability Index (PSI)***
>
> *The system monitors customer feature distributions in real time. If the PSI exceeds 0.20 on critical confounders, the dashboard flags an alert advising the marketing team to retrain the Double ML model."*

---

## 📊 Section 6: Dataset & Campaign Upload (4:45 – 5:15)
**[Tab: Dataset & Confounders]**

### What to Click / Point To:
- The **Upload Custom Campaign CSV** button
- The **Dataset Metrics** cards (Total records, conversion rates, discount splits)
- The **Sample Observational Records** table

### What to Say:
> *"Finally, under the **Dataset & Confounders** tab, users can explore the observational data or click **'Upload Custom Campaign CSV'** to upload their own enterprise marketing data.*
>
> *Once uploaded, EconoCausal automatically parses the columns, re-evaluates the DAG, fits the Double ML models, and regenerates the personalized prescription matrix within seconds."*

---

## 🎯 Conclusion & Key Takeaway (5:15 – 5:45)

> *"To summarize: **EconoCausal** bridges the gap between machine learning and economic decision-making.*
> 
> *By shifting from predictive correlation to **Double Machine Learning** and **Prescriptive SciPy Optimization**, it delivers:*
> 1. ***Zero discount waste** on customers who buy anyway.*
> 2. *A **+114% marketing efficiency gain** over traditional predictive ML.*
> 3. *A mathematically audited, fully deployable platform ready for modern marketing and finance teams.*
>
> *Thank you, and I look forward to your questions!"*

---

## 💡 Quick Viva Defense Q&A Preparation

| Question | Strongest Answer |
| :--- | :--- |
| **Q: What is the main mathematical difference between Predictive ML and Causal ML?** | *"Predictive ML estimates conditional expectation $E[Y \mid X]$, which captures correlation. Causal ML estimates interventional expectation $E[Y \mid do(T=t)]$, which isolates the counterfactual change in outcome caused directly by the treatment."* |
| **Q: Why use Double Machine Learning instead of simple linear regression?** | *"Simple linear regression assumes linear relationships and suffers from severe omitted variable bias. DML allows using flexible non-parametric models like LightGBM while maintaining $\sqrt{N}$-consistency and asymptotic normality through Neyman orthogonalization and cross-fitting."* |
| **Q: How does the optimizer ensure the budget isn't exceeded?** | *"We formulate it as a Mixed Integer Linear Program (MILP) in SciPy with a hard constraint: $\sum \text{Cost}_{i,k} \cdot x_{i,k} \le \text{Budget}$. It selects the highest marginal uplift per dollar until the budget is exhausted."* |
