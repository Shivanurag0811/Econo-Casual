import numpy as np
import pandas as pd
from scipy.stats import ks_2samp
from typing import Dict, Any, List

FEATURE_COLS = ["income_k", "loyalty_score", "visits_per_month", "recency_days", "age"]

def calculate_psi(baseline: np.ndarray, current: np.ndarray, num_buckets: int = 10) -> float:
    """
    Calculates the Population Stability Index (PSI) between baseline and current distributions.
    PSI = sum((Actual% - Expected%) * ln(Actual% / Expected%))
    """
    # Remove NaNs
    b = baseline[~np.isnan(baseline)]
    c = current[~np.isnan(current)]
    if len(b) == 0 or len(c) == 0:
        return 0.0

    # Determine quantile bins based on baseline
    percentiles = np.linspace(0, 100, num_buckets + 1)
    bins = np.percentile(b, percentiles)
    bins[0] -= 1e-5
    bins[-1] += 1e-5
    bins = np.unique(bins)
    
    if len(bins) < 2:
        return 0.0

    b_counts, _ = np.histogram(b, bins=bins)
    c_counts, _ = np.histogram(c, bins=bins)

    b_pct = b_counts / (len(b) + 1e-8)
    c_pct = c_counts / (len(c) + 1e-8)

    # Avoid zero division
    eps = 1e-4
    b_pct = np.clip(b_pct, eps, 1.0)
    c_pct = np.clip(c_pct, eps, 1.0)

    psi = np.sum((c_pct - b_pct) * np.log(c_pct / b_pct))
    return float(psi)

class CustomerBehaviorDriftDetector:
    """
    Monitors covariate shift and behavioral drift in customer populations
    to ensure causal DML models remain valid over time.
    """
    def __init__(self, baseline_df: pd.DataFrame):
        self.baseline_df = baseline_df.copy()

    def detect_drift(self, current_df: pd.DataFrame, alpha: float = 0.05) -> Dict[str, Any]:
        results = []
        drift_detected_count = 0

        for col in FEATURE_COLS:
            if col in self.baseline_df.columns and col in current_df.columns:
                b_vals = self.baseline_df[col].dropna().values
                c_vals = current_df[col].dropna().values

                # 1. Kolmogorov-Smirnov test
                ks_stat, p_val = ks_2samp(b_vals, c_vals)

                # 2. Population Stability Index (PSI)
                psi = calculate_psi(b_vals, c_vals)

                # Status decision
                is_drift = bool(p_val < alpha and psi > 0.10)
                if is_drift:
                    drift_detected_count += 1

                if psi < 0.10:
                    status = "Stable (No Shift)"
                elif psi < 0.20:
                    status = "Moderate Shift"
                else:
                    status = "Significant Drift"

                results.append({
                    "feature": col,
                    "ks_statistic": round(float(ks_stat), 4),
                    "p_value": round(float(p_val), 4),
                    "psi_score": round(float(psi), 4),
                    "status": status,
                    "drift_flag": is_drift
                })

        overall_drift = drift_detected_count >= 2
        recommendation = (
            "WARNING: Significant customer behavior drift detected across key confounders. Causal ITE estimates may degrade. Recommend model retraining."
            if overall_drift else
            "STABLE: Customer behavior distribution is consistent with baseline. Causal policies remain high-confidence."
        )

        return {
            "overall_drift_detected": overall_drift,
            "drifted_features_count": drift_detected_count,
            "total_features_monitored": len(results),
            "recommendation": recommendation,
            "feature_metrics": results
        }

if __name__ == "__main__":
    df = pd.read_csv("data/retail_promotions.csv")
    detector = CustomerBehaviorDriftDetector(df)
    # Test on perturbed dataset
    perturbed_df = df.copy()
    perturbed_df["income_k"] = perturbed_df["income_k"] * 1.35
    perturbed_df["recency_days"] = perturbed_df["recency_days"] * 0.70
    report = detector.detect_drift(perturbed_df)
    print("\nDRIFT DETECTION REPORT:")
    print("Overall Drift Detected:", report["overall_drift_detected"])
    print("Recommendation:", report["recommendation"])
    for m in report["feature_metrics"]:
        print(f" - {m['feature']}: {m['status']} (PSI: {m['psi_score']}, KS p-val: {m['p_value']})")
