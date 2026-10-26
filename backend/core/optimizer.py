import os
import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
import numpy as np
import pandas as pd
from scipy.optimize import milp, LinearConstraint, Bounds
from typing import Dict, Any, List

def optimize_discount_allocation(
    df_with_ite: pd.DataFrame,
    total_budget: float = 5000.0,
    gross_margin_pct: float = 0.50,
    objective: str = "conversions"  # "conversions" (maximize incremental sales) or "profit" (strict net profit)
) -> Dict[str, Any]:
    """
    Formulates and solves a Mixed Integer Linear Program (MILP) via scipy.optimize.milp
    to assign optimal personalized discounts ($0, $10, $20) to maximize incremental revenue/profit
    subject to the strict total marketing budget constraint.
    """
    df = df_with_ite.copy().reset_index(drop=True)
    n = len(df)
    
    # 3 discount tiers: 0 ($0), 1 ($10), 2 ($20)
    tiers = [0.0, 10.0, 20.0]
    n_tiers = len(tiers)
    
    if "order_value" in df.columns and (df["order_value"] > 0).any():
        avg_basket = float(df["order_value"].replace(0, np.nan).median())
        if np.isnan(avg_basket):
            avg_basket = 85.0
    else:
        avg_basket = 85.0
        
    basket_margin = avg_basket * gross_margin_pct
    
    benefit_matrix = np.zeros((n, n_tiers))
    cost_matrix = np.zeros((n, n_tiers))
    
    ite_10_vals = df["ite_10"].values if "ite_10" in df.columns else np.zeros(n)
    ite_20_vals = df["ite_20"].values if "ite_20" in df.columns else np.zeros(n)
    
    for i in range(n):
        benefit_matrix[i, 0] = 0.0
        cost_matrix[i, 0] = 0.0
        
        if objective == "profit":
            benefit_matrix[i, 1] = (ite_10_vals[i] * basket_margin) - 10.0
            benefit_matrix[i, 2] = (ite_20_vals[i] * basket_margin) - 20.0
        else: # "conversions" / incremental revenue
            # Maximize incremental revenue lift per promotional dollar spent
            benefit_matrix[i, 1] = max(0.0, ite_10_vals[i] * avg_basket)
            benefit_matrix[i, 2] = max(0.0, ite_20_vals[i] * avg_basket)
            
        cost_matrix[i, 1] = 10.0
        cost_matrix[i, 2] = 20.0

    # Decision variables: x_{i, k} binary indicator for customer i receiving tier k
    # Total variables = n * 3
    num_vars = n * n_tiers
    
    # Objective: Maximize sum(benefit * x) <=> Minimize sum(-benefit * x)
    c = -benefit_matrix.flatten()
    
    # Constraints:
    # 1. Budget constraint: sum_{i, k} (cost_{i, k} * x_{i, k}) <= total_budget
    # 2. Exactly one tier assigned per customer: sum_k x_{i, k} == 1 for all i
    
    # Row 1: Budget constraint
    budget_row = cost_matrix.flatten()
    
    # Rows 2 to n+1: One tier per customer
    one_tier_matrix = np.zeros((n, num_vars))
    for i in range(n):
        one_tier_matrix[i, (i * n_tiers):((i + 1) * n_tiers)] = 1.0
        
    A = np.vstack([budget_row, one_tier_matrix])
    
    # Bounds for constraints:
    # Budget: 0 <= spend <= total_budget
    # Each customer assignment: 1 <= sum <= 1
    lhs = np.concatenate([[0.0], np.ones(n)])
    rhs = np.concatenate([[float(total_budget)], np.ones(n)])
    
    constraints = LinearConstraint(A, lhs, rhs)
    integrality = np.ones(num_vars)  # All variables are binary {0, 1}
    bounds = Bounds(0, 1)
    
    # Solve using SciPy MILP
    res = milp(c=c, integrality=integrality, constraints=constraints, bounds=bounds)
    
    if res.success:
        solution = res.x.reshape((n, n_tiers))
        chosen_tiers_idx = np.argmax(solution, axis=1)
    else:
        # Heuristic greedy fallback by efficiency ratio if exact solver exceeds time limit
        chosen_tiers_idx = np.zeros(n, dtype=int)
        remaining_budget = total_budget
        # Sort by marginal ROI of tier 2 then tier 1
        roi_20 = benefit_matrix[:, 2] / 20.0
        order = np.argsort(-roi_20)
        for idx in order:
            if roi_20[idx] > 0 and remaining_budget >= 20.0:
                chosen_tiers_idx[idx] = 2
                remaining_budget -= 20.0
            elif benefit_matrix[idx, 1] > 0 and remaining_budget >= 10.0:
                chosen_tiers_idx[idx] = 1
                remaining_budget -= 10.0
                
    prescribed_discount = np.array([tiers[k] for k in chosen_tiers_idx])
    assigned_uplift = np.zeros(n)
    for i in range(n):
        if chosen_tiers_idx[i] == 1:
            assigned_uplift[i] = ite_10_vals[i]
        elif chosen_tiers_idx[i] == 2:
            assigned_uplift[i] = ite_20_vals[i]
            
    df["prescribed_discount"] = prescribed_discount
    df["expected_uplift"] = assigned_uplift.round(4)
    
    total_spend = float(np.sum(prescribed_discount))
    total_incremental_conversions = float(np.sum(assigned_uplift))
    gross_incremental_revenue = float(total_incremental_conversions * avg_basket)
    net_incremental_profit = float(gross_incremental_revenue * gross_margin_pct - total_spend)
    
    # Benchmarks:
    # 1. Blanket targeting (assign $10 uniformly until budget exhausts)
    blanket_spend = min(total_budget, n * 10.0)
    blanket_n = int(blanket_spend / 10.0)
    blanket_uplift = float(np.mean(ite_10_vals) * blanket_n)
    blanket_profit = float(blanket_uplift * avg_basket * gross_margin_pct - blanket_spend)
    
    # 2. Predictive ML targeting (assign discounts to top spenders/high propensity)
    # These are often "Sure Things" who would convert anyway!
    high_prop_idx = np.argsort(-(df["income_k"].values + df["loyalty_score"].values))[:blanket_n]
    predictive_uplift = float(np.sum(ite_10_vals[high_prop_idx]))
    predictive_profit = float(predictive_uplift * avg_basket * gross_margin_pct - blanket_spend)
    
    savings_vs_blanket = max(0.0, net_incremental_profit - blanket_profit)
    roi_pct = round((net_incremental_profit / (total_spend + 1e-5)) * 100, 1)
    
    # Segment breakdown of allocation
    tier_counts = {
        "tier_0_no_discount": int(np.sum(prescribed_discount == 0)),
        "tier_10_discount": int(np.sum(prescribed_discount == 10)),
        "tier_20_discount": int(np.sum(prescribed_discount == 20))
    }
    
    # Targeted segment distribution
    targeted_mask = prescribed_discount > 0
    segment_counts = df.loc[targeted_mask, "causal_segment"].value_counts().to_dict() if "causal_segment" in df.columns else {}
    
    # Sample prescription rows for UI table display (first 100 rows + top targeted)
    display_cols = ["customer_id", "age", "income_k", "loyalty_score", "visits_per_month", "recency_days", "causal_segment", "prescribed_discount", "expected_uplift"]
    valid_cols = [c for c in display_cols if c in df.columns]
    
    # Sort with targeted customers first
    df_sorted = df.sort_values(by=["prescribed_discount", "expected_uplift"], ascending=[False, False])
    prescriptions_table = df_sorted[valid_cols].head(150).to_dict(orient="records")
    
    return {
        "status": "Optimal Solution Found" if res.success else "Heuristic Optimal Allocation",
        "total_budget": total_budget,
        "total_allocated_spend": total_spend,
        "remaining_budget": round(total_budget - total_spend, 2),
        "total_customers_evaluated": n,
        "total_customers_targeted": int(np.sum(prescribed_discount > 0)),
        "expected_incremental_conversions": round(total_incremental_conversions, 1),
        "expected_incremental_revenue": round(gross_incremental_revenue, 2),
        "net_incremental_profit": round(net_incremental_profit, 2),
        "roi_percentage": roi_pct,
        "tier_breakdown": tier_counts,
        "targeted_segments": segment_counts,
        "benchmark_comparisons": {
            "causal_dml_profit": round(net_incremental_profit, 2),
            "blanket_targeting_profit": round(blanket_profit, 2),
            "predictive_ml_profit": round(predictive_profit, 2),
            "value_added_over_blanket": round(savings_vs_blanket, 2),
            "value_added_over_predictive_ml": round(net_incremental_profit - predictive_profit, 2)
        },
        "executive_summary": f"EconoCausal SciPy solver allocated ${total_spend:,.0f} across {int(np.sum(prescribed_discount > 0))} persuadable customers, generating an expected ${gross_incremental_revenue:,.0f} in incremental revenue and beating blanket targeting by ${savings_vs_blanket:,.0f} in net profit.",
        "prescriptions": prescriptions_table
    }

if __name__ == "__main__":
    from backend.core.causal_dml import DoubleMLEngine
    df = pd.read_csv("data/retail_promotions.csv")
    engine = DoubleMLEngine()
    engine.fit(df)
    results = engine.predict_ite(df)
    alloc = optimize_discount_allocation(results, total_budget=5000.0)
    print("\nPRESCRIPTIVE OPTIMIZATION RESULTS:")
    print("Executive Summary:", alloc["executive_summary"])
    print("Spend Allocated:", alloc["total_allocated_spend"], "of", alloc["total_budget"])
    print("Targeted Segments:", alloc["targeted_segments"])
    print("Profit Comparison:", alloc["benchmark_comparisons"])
