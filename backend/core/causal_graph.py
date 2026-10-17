import os
import sys
import tempfile
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
os.environ["MPLCONFIGDIR"] = os.path.join(tempfile.gettempdir(), "matplotlib")

import dowhy
from dowhy import CausalModel
import pandas as pd
from typing import Dict, Any, List

CONFOUNDERS = ["income_k", "loyalty_score", "visits_per_month", "recency_days"]
EFFECT_MODIFIERS = ["age", "category_affinity"]

def get_graph_metadata() -> Dict[str, Any]:
    """
    Returns structured nodes and edges for frontend UI visualization.
    """
    nodes = [
        {"id": "discount_offered", "label": "Discount Offered ($)", "type": "treatment", "role": "Intervention (T)"},
        {"id": "converted", "label": "Purchase Conversion (0/1)", "type": "outcome", "role": "Target Outcome (Y)"},
        {"id": "income_k", "label": "Customer Income ($k)", "type": "confounder", "role": "Confounder (W)"},
        {"id": "loyalty_score", "label": "Loyalty Tier / Score", "type": "confounder", "role": "Confounder (W)"},
        {"id": "visits_per_month", "label": "Monthly Visit Freq", "type": "confounder", "role": "Confounder (W)"},
        {"id": "recency_days", "label": "Recency (Days)", "type": "confounder", "role": "Confounder (W)"},
        {"id": "age", "label": "Customer Age", "type": "covariate", "role": "Effect Modifier (X)"}
    ]
    
    edges = [
        {"source": "income_k", "target": "discount_offered", "label": "Selection Bias"},
        {"source": "income_k", "target": "converted", "label": "Direct Effect"},
        {"source": "loyalty_score", "target": "discount_offered", "label": "Selection Bias"},
        {"source": "loyalty_score", "target": "converted", "label": "Direct Effect"},
        {"source": "visits_per_month", "target": "discount_offered", "label": "Selection Bias"},
        {"source": "visits_per_month", "target": "converted", "label": "Direct Effect"},
        {"source": "recency_days", "target": "discount_offered", "label": "Selection Bias"},
        {"source": "recency_days", "target": "converted", "label": "Direct Effect"},
        {"source": "age", "target": "converted", "label": "Modifier"},
        {"source": "discount_offered", "target": "converted", "label": "True Causal Uplift"}
    ]
    
    return {
        "nodes": nodes,
        "edges": edges,
        "confounders": CONFOUNDERS,
        "effect_modifiers": EFFECT_MODIFIERS,
        "treatment": "discount_offered",
        "outcome": "converted"
    }

def initialize_causal_model(df: pd.DataFrame, treatment: str = "discount_offered", outcome: str = "converted") -> CausalModel:
    """
    Initializes a DoWhy CausalModel with specified common causes (confounders)
    and effect modifiers.
    """
    model_df = df.copy()
    if treatment in model_df.columns and model_df[treatment].nunique() > 2:
        model_df["treatment_binary"] = (model_df[treatment] > 0).astype(int)
        actual_treatment = "treatment_binary"
    else:
        actual_treatment = treatment
        
    model = CausalModel(
        data=model_df,
        treatment=actual_treatment,
        outcome=outcome,
        common_causes=CONFOUNDERS,
        effect_modifiers=["age"]
    )
    return model

if __name__ == "__main__":
    df = pd.read_csv("data/retail_promotions.csv")
    model = initialize_causal_model(df)
    print("Causal Model initialized successfully!")
    identified_estimand = model.identify_effect(proceed_when_unidentifiable=True)
    print("\nIdentified Backdoor Estimand:")
    print(identified_estimand)
