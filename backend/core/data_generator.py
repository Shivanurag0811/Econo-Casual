import os
import numpy as np
import pandas as pd

def generate_retail_campaign_data(n_samples: int = 5000, random_seed: int = 42) -> pd.DataFrame:
    """
    Generates synthetic retail observational campaign data with known ground-truth
    causal mechanisms, confounders, selection bias, and heterogeneous treatment effects.
    
    Customer Segments:
    - Persuadables: Moderate income, regular visitors, high discount elasticity (ITE > 0.15)
    - Sure Things: High income, high loyalty, buys regardless of discount (ITE ~ 0)
    - Lost Causes: Low affinity, dormant recency, never buys even with discount (ITE ~ 0)
    - Sleeping Dogs: Loyal customers annoyed by spam/cheapening discounts (ITE < 0)
    """
    np.random.seed(random_seed)
    
    # 1. Customer Confounders / Features
    customer_id = [f"CUST_{10000 + i}" for i in range(n_samples)]
    age = np.random.normal(38, 12, n_samples).clip(18, 75).astype(int)
    income_k = np.random.lognormal(mean=3.9, sigma=0.45, size=n_samples).clip(20, 180).round(1)
    loyalty_score = np.random.beta(a=2.5, b=2.5, size=n_samples).round(3) * 100  # 0 to 100
    visits_per_month = np.random.poisson(lam=3.5, size=n_samples).clip(0, 20)
    recency_days = np.random.exponential(scale=25, size=n_samples).clip(1, 120).astype(int)
    category_affinity = np.random.choice(['Electronics', 'Fashion', 'HomeGoods', 'Groceries'], size=n_samples, p=[0.25, 0.35, 0.20, 0.20])
    
    # 2. Historical Confounded Treatment Assignment (Selection Bias)
    # Marketing teams historically sent higher discounts to high-loyalty or high-income customers
    # Propensity to receive discount is confounded by income and loyalty
    propensity_score = (
        0.15 +
        0.003 * (income_k - 50) +
        0.004 * (loyalty_score - 50) +
        0.02 * (visits_per_month - 3) -
        0.002 * (recency_days - 30)
    )
    # Clip between 0.05 and 0.95
    propensity_score = 1.0 / (1.0 + np.exp(-3.0 * (propensity_score - 0.2)))
    propensity_score = np.clip(propensity_score, 0.05, 0.95)
    
    # Treatment levels: 0 (No discount), 10 ($10 discount), 20 ($20 discount)
    treatment_rand = np.random.uniform(0, 1, size=n_samples)
    treatment = np.zeros(n_samples, dtype=int)
    for i in range(n_samples):
        p = propensity_score[i]
        if treatment_rand[i] < (1.0 - p):
            treatment[i] = 0
        elif treatment_rand[i] < (1.0 - p * 0.4):
            treatment[i] = 10
        else:
            treatment[i] = 20

    # 3. Ground Truth Causal Archetypes & Heterogeneous Treatment Effect (ITE)
    # Base purchase probability without treatment:
    base_logits = (
        -2.5 +
        0.025 * (income_k - 40) +
        0.035 * (loyalty_score - 40) +
        0.15 * visits_per_month -
        0.03 * recency_days
    )
    base_purchase_prob = 1.0 / (1.0 + np.exp(-base_logits))
    
    # Causal Effect of Treatment (ITE) depends on customer features:
    # Persuadability is peak for middle-income customers with moderate engagement
    persuadability = (
        np.exp(-((income_k - 60) ** 2) / 800.0) *
        np.exp(-((visits_per_month - 4) ** 2) / 10.0) *
        np.clip((60 - recency_days) / 60.0, 0, 1)
    )
    
    # True ITE per $10 of discount
    true_ite_10 = (0.28 * persuadability).clip(-0.05, 0.45)
    true_ite_20 = (0.42 * persuadability).clip(-0.08, 0.65)
    
    # Actual conversion outcome with treatment
    effective_ite = np.zeros(n_samples)
    for i in range(n_samples):
        if treatment[i] == 10:
            effective_ite[i] = true_ite_10[i]
        elif treatment[i] == 20:
            effective_ite[i] = true_ite_20[i]
        else:
            effective_ite[i] = 0.0
            
    final_prob = np.clip(base_purchase_prob + effective_ite, 0.01, 0.99)
    converted = (np.random.uniform(0, 1, n_samples) < final_prob).astype(int)
    
    # Order value if converted
    base_order_val = (35.0 + 0.6 * income_k + 8.0 * (category_affinity == 'Electronics') + np.random.normal(0, 10, n_samples)).clip(15, 300).round(2)
    order_value = np.where(converted == 1, base_order_val, 0.0)
    net_revenue = np.where(converted == 1, (order_value - treatment).clip(min=0), 0.0).round(2)
    
    # Classify archetype
    archetype = []
    for i in range(n_samples):
        b = base_purchase_prob[i]
        u = true_ite_20[i]
        if u > 0.12:
            archetype.append("Persuadables")
        elif b > 0.65:
            archetype.append("Sure Things")
        elif b < 0.15 and u < 0.05:
            archetype.append("Lost Causes")
        else:
            archetype.append("Sleeping Dogs" if u < 0 else "Neutral")
            
    df = pd.DataFrame({
        "customer_id": customer_id,
        "age": age,
        "income_k": income_k,
        "loyalty_score": loyalty_score,
        "visits_per_month": visits_per_month,
        "recency_days": recency_days,
        "category_affinity": category_affinity,
        "discount_offered": treatment,
        "converted": converted,
        "order_value": order_value,
        "net_revenue": net_revenue,
        "true_ite_10": true_ite_10.round(4),
        "true_ite_20": true_ite_20.round(4),
        "propensity_score": propensity_score.round(4),
        "customer_segment": archetype
    })
    
    return df

def save_benchmark_dataset(dest_path: str = "data/retail_promotions.csv", n_samples: int = 5000):
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    df = generate_retail_campaign_data(n_samples=n_samples)
    df.to_csv(dest_path, index=False)
    print(f"Generated benchmark dataset at {dest_path} with {len(df)} records.")
    return df

if __name__ == "__main__":
    save_benchmark_dataset()
