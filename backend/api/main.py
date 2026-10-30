import os
import sys
import tempfile
import io
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
os.environ["MPLCONFIGDIR"] = os.path.join(tempfile.gettempdir(), "matplotlib")

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np

from backend.core.data_generator import generate_retail_campaign_data, save_benchmark_dataset
from backend.core.causal_graph import get_graph_metadata, initialize_causal_model
from backend.core.causal_dml import DoubleMLEngine
from backend.core.refutation import CausalAuditor
from backend.core.uplift_eval import compute_uplift_curves
from backend.core.optimizer import optimize_discount_allocation
from backend.core.drift_detector import CustomerBehaviorDriftDetector

app = FastAPI(
    title="EconoCausal API",
    description="Dynamic Pricing and Promotional Budget Allocation via Double Machine Learning (DML)",
    version="1.0.0"
)

# Enable CORS for local Vite development frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory Application State Cache
STATE: Dict[str, Any] = {
    "df": None,
    "df_with_ite": None,
    "dml_engine": None,
    "causal_audit_report": None,
    "latest_optimization": None,
    "baseline_df": None
}

def ensure_dataset():
    if STATE["df"] is None:
        csv_path = "data/retail_promotions.csv"
        if os.path.exists(csv_path):
            STATE["df"] = pd.read_csv(csv_path)
        else:
            STATE["df"] = save_benchmark_dataset(csv_path, n_samples=3000)
        STATE["baseline_df"] = STATE["df"].copy()
    return STATE["df"]

@app.on_event("startup")
def startup_event():
    ensure_dataset()

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "EconoCausal Causal Inference Engine", "version": "1.0.0"}

@app.get("/api/dataset")
def get_dataset_summary():
    df = ensure_dataset()
    preview = df.head(50).fillna("").to_dict(orient="records")
    stats = {
        "total_records": len(df),
        "columns": list(df.columns),
        "avg_income_k": round(float(df["income_k"].mean()), 1) if "income_k" in df.columns else 0,
        "avg_loyalty": round(float(df["loyalty_score"].mean()), 1) if "loyalty_score" in df.columns else 0,
        "overall_conversion_rate": round(float(df["converted"].mean() * 100), 1) if "converted" in df.columns else 0,
        "discount_distribution": df["discount_offered"].value_counts().to_dict() if "discount_offered" in df.columns else {}
    }
    return {
        "stats": stats,
        "sample_records": preview
    }

@app.post("/api/reset-benchmark")
def reset_benchmark_data(n_samples: int = Query(3000, ge=500, le=10000)):
    csv_path = "data/retail_promotions.csv"
    df = save_benchmark_dataset(csv_path, n_samples=n_samples)
    STATE["df"] = df
    STATE["baseline_df"] = df.copy()
    STATE["df_with_ite"] = None
    STATE["dml_engine"] = None
    STATE["causal_audit_report"] = None
    STATE["latest_optimization"] = None
    return {"message": f"Successfully regenerated benchmark retail dataset with {n_samples} customer records."}

@app.post("/api/upload-dataset")
async def upload_dataset(file: UploadFile = File(...)):
    try:
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content))
        required = ["discount_offered", "converted"]
        missing = [c for c in required if c not in df.columns]
        if missing:
            raise HTTPException(status_code=400, detail=f"Uploaded CSV is missing mandatory columns: {missing}")
            
        STATE["df"] = df
        STATE["df_with_ite"] = None
        STATE["dml_engine"] = None
        STATE["latest_optimization"] = None
        return {
            "message": f"Dataset '{file.filename}' uploaded successfully.",
            "total_records": len(df),
            "columns": list(df.columns)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/causal-graph")
def get_causal_graph():
    return get_graph_metadata()

class TrainDMLRequest(BaseModel):
    model_type: str = Field("linear_dml", description="'linear_dml' or 'causal_forest'")
    n_folds: int = Field(3, ge=2, le=5)

@app.post("/api/train-dml")
def train_dml_model(req: TrainDMLRequest):
    df = ensure_dataset()
    engine = DoubleMLEngine(model_type=req.model_type, n_folds=req.n_folds)
    engine.fit(df)
    
    # Predict individual treatment effects
    results_df = engine.predict_ite(df)
    STATE["df_with_ite"] = results_df
    STATE["dml_engine"] = engine
    
    # Archetype breakdown
    segment_counts = results_df["causal_segment"].value_counts().to_dict()
    feature_importance = engine.get_feature_importance()
    
    # Summary of ITE
    ite_summary = {
        "mean_ite_10": round(float(results_df["ite_10"].mean()), 4),
        "max_ite_10": round(float(results_df["ite_10"].max()), 4),
        "mean_ite_20": round(float(results_df["ite_20"].mean()), 4),
        "max_ite_20": round(float(results_df["ite_20"].max()), 4),
        "persuadables_pct": round((segment_counts.get("Persuadables", 0) / len(results_df)) * 100, 1),
        "segments": segment_counts,
        "feature_importance": feature_importance
    }
    
    return {
        "message": f"Successfully trained Double Machine Learning ({req.model_type}) across {len(df)} records.",
        "model_type": req.model_type,
        "ite_summary": ite_summary,
        "sample_prescriptions": results_df.head(20).fillna("").to_dict(orient="records")
    }

@app.get("/api/uplift-curves")
def get_uplift_curves():
    if STATE["df_with_ite"] is None:
        # Auto train if not yet done
        train_dml_model(TrainDMLRequest(model_type="linear_dml"))
        
    curves = compute_uplift_curves(STATE["df_with_ite"])
    return curves

@app.post("/api/causal-audit")
def run_causal_audit():
    df = ensure_dataset()
    # Run DoWhy refutation suite
    auditor = CausalAuditor(df)
    audit_report = auditor.run_full_causal_audit()
    STATE["causal_audit_report"] = audit_report
    return audit_report

class OptimizeBudgetRequest(BaseModel):
    total_budget: float = Field(5000.0, ge=500.0, le=100000.0)
    gross_margin_pct: float = Field(0.50, ge=0.1, le=1.0)
    objective: str = Field("conversions", description="'conversions' or 'profit'")

@app.post("/api/optimize-budget")
def optimize_budget(req: OptimizeBudgetRequest):
    if STATE["df_with_ite"] is None:
        train_dml_model(TrainDMLRequest(model_type="linear_dml"))
        
    allocation = optimize_discount_allocation(
        STATE["df_with_ite"],
        total_budget=req.total_budget,
        gross_margin_pct=req.gross_margin_pct,
        objective=req.objective
    )
    STATE["latest_optimization"] = allocation
    return allocation

@app.get("/api/drift-analysis")
def get_drift_analysis():
    df = ensure_dataset()
    baseline = STATE["baseline_df"] if STATE["baseline_df"] is not None else df
    detector = CustomerBehaviorDriftDetector(baseline)
    report = detector.detect_drift(df)
    return report

@app.get("/api/executive-summary")
def get_executive_summary():
    if STATE["latest_optimization"] is None:
        optimize_budget(OptimizeBudgetRequest(total_budget=5000.0))
        
    opt = STATE["latest_optimization"]
    bench = opt["benchmark_comparisons"]
    
    return {
        "headline": "EconoCausal Prescriptive Dynamic Pricing Summary",
        "budget_allocated": f"${opt['total_allocated_spend']:,.0f} of ${opt['total_budget']:,.0f}",
        "persuadables_targeted": opt["total_customers_targeted"],
        "expected_incremental_revenue": f"${opt['expected_incremental_revenue']:,.0f}",
        "net_incremental_profit": f"${opt['net_incremental_profit']:,.0f}",
        "savings_vs_blanket": f"${bench['value_added_over_blanket']:,.0f}",
        "savings_vs_predictive_ml": f"${bench['value_added_over_predictive_ml']:,.0f}",
        "narrative": (
            f"By replacing correlation-based predictive scoring with EconML Double Machine Learning, "
            f"EconoCausal isolated the Individual Treatment Effect (ITE) and allocated 100% of the ${opt['total_budget']:,.0f} budget "
            f"exclusively to Persuadables. This delivers an incremental profit advantage of ${bench['value_added_over_blanket']:,.0f} "
            f"over unsegmented blanket targeting and ${bench['value_added_over_predictive_ml']:,.0f} over standard predictive churn models."
        )
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.api.main:app", host="127.0.0.1", port=8000, reload=True)
