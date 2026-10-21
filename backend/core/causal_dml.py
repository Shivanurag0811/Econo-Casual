import os
import sys
import tempfile
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
os.environ["MPLCONFIGDIR"] = os.path.join(tempfile.gettempdir(), "matplotlib")

import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple, Optional
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier, GradientBoostingRegressor
from sklearn.model_selection import KFold
import lightgbm as lgb
from econml.dml import LinearDML, CausalForestDML

FEATURE_COLS = ["income_k", "loyalty_score", "visits_per_month", "recency_days", "age"]
CONFOUNDER_COLS = ["income_k", "loyalty_score", "visits_per_month", "recency_days"]

class DoubleMLEngine:
    """
    Double Machine Learning (DML) Engine for Causal Pricing & Uplift.
    Implements Chernozhukov et al. (2018) Debiased Machine Learning
    with EconML and cross-fitted orthogonalization.
    """
    def __init__(self, model_type: str = "linear_dml", n_folds: int = 3, random_state: int = 42):
        self.model_type = model_type
        self.n_folds = n_folds
        self.random_state = random_state
        self.dml_model = None
        self.feature_names = FEATURE_COLS
        self.is_fitted = False
        
    def _create_base_estimators(self):
        """Builds flexible LightGBM or Random Forest estimators for nuisance models."""
        reg_y = lgb.LGBMRegressor(
            n_estimators=100,
            learning_rate=0.05,
            max_depth=4,
            random_state=self.random_state,
            verbose=-1
        )
        reg_t = lgb.LGBMRegressor(
            n_estimators=100,
            learning_rate=0.05,
            max_depth=4,
            random_state=self.random_state,
            verbose=-1
        )
        return reg_y, reg_t

    def fit(self, df: pd.DataFrame, treatment_col: str = "discount_offered", outcome_col: str = "converted"):
        """
        Fits the DML model on observational data to isolate causal effects from confounders.
        """
        X = df[FEATURE_COLS].values
        W = df[CONFOUNDER_COLS].values
        T = df[treatment_col].values.astype(float)
        Y = df[outcome_col].values.astype(float)
        
        reg_y, reg_t = self._create_base_estimators()
        
        if self.model_type == "causal_forest":
            # Causal Forest DML from EconML
            self.dml_model = CausalForestDML(
                model_y=reg_y,
                model_t=reg_t,
                discrete_treatment=False,
                n_estimators=100,
                subforest_size=4,
                cv=self.n_folds,
                random_state=self.random_state
            )
        else:
            # Linear DML with feature interactions
            self.dml_model = LinearDML(
                model_y=reg_y,
                model_t=reg_t,
                discrete_treatment=False,
                cv=self.n_folds,
                random_state=self.random_state
            )
            
        # Fit Double ML model: Y ~ T | X, W
        self.dml_model.fit(Y=Y, T=T, X=X, W=W)
        self.is_fitted = True
        return self

    def predict_ite(self, df: pd.DataFrame, treatment_amounts: Tuple[float, float] = (10.0, 20.0)) -> pd.DataFrame:
        """
        Estimates the Individual Treatment Effect (ITE / CATE) for each customer
        for given treatment counterfactuals (e.g. $10 and $20 discounts vs $0 control).
        """
        if not self.is_fitted:
            raise ValueError("DoubleMLEngine must be fitted before predicting ITE.")
            
        X = df[FEATURE_COLS].values
        
        # Marginal causal effect per $1 of discount: dY / dT
        marginal_effect = self.dml_model.effect(X)  # shape (n,)
        
        ite_10 = marginal_effect * treatment_amounts[0]
        ite_20 = marginal_effect * treatment_amounts[1]
        
        # Segment customers into Causal Archetypes based on predicted ITE & baseline
        # Baseline prediction E[Y | T=0, X]
        results_df = df.copy()
        results_df["predicted_marginal_effect"] = np.round(marginal_effect, 5)
        results_df["ite_10"] = np.round(ite_10, 4)
        results_df["ite_20"] = np.round(ite_20, 4)
        
        # Segment classification based on causal uplift
        archetypes = []
        for i in range(len(results_df)):
            u20 = ite_20[i]
            # Persuadables: high uplift from discount
            if u20 >= 0.10:
                archetypes.append("Persuadables")
            elif u20 < -0.02:
                archetypes.append("Sleeping Dogs")
            else:
                # If low uplift, check baseline conversion
                conv = results_df.iloc[i].get("converted", 0)
                if conv == 1 and results_df.iloc[i]["discount_offered"] == 0:
                    archetypes.append("Sure Things")
                else:
                    archetypes.append("Lost Causes")
                    
        results_df["causal_segment"] = archetypes
        return results_df

    def get_feature_importance(self) -> Dict[str, float]:
        """Returns the importance of each feature in moderating the treatment effect."""
        if not self.is_fitted:
            return {}
        try:
            coefs = np.abs(self.dml_model.coef_)
            total = np.sum(coefs)
            if total > 0:
                norm_coefs = coefs / total
                return {feat: round(float(val), 4) for feat, val in zip(self.feature_names, norm_coefs)}
        except Exception:
            pass
        return {feat: 1.0 / len(self.feature_names) for feat in self.feature_names}

if __name__ == "__main__":
    df = pd.read_csv("data/retail_promotions.csv")
    engine = DoubleMLEngine(model_type="linear_dml")
    engine.fit(df)
    results = engine.predict_ite(df.head(20))
    print("Double ML Sample Predictions:")
    print(results[["customer_id", "income_k", "loyalty_score", "predicted_marginal_effect", "ite_10", "ite_20", "causal_segment"]].head())
    print("\nTreatment Heterogeneity Feature Importance:", engine.get_feature_importance())
