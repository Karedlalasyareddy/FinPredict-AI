"""
finpredict_ai/predictor.py
Machine Learning and statistical forecasting engine.
Uses scikit-learn, XGBoost, and statsmodels to forecast personal financial metrics.
Operates exclusively on the logged-in user's stored transaction history.
"""

import os
import math
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple, Optional, List
import joblib

# Core scikit-learn imports
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# Optional libraries with graceful fallbacks
try:
    from xgboost import XGBRegressor
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False

try:
    from statsmodels.tsa.api import SimpleExpSmoothing, Holt
    HAS_STATSMODELS = True
except ImportError:
    HAS_STATSMODELS = False

from database import get_transactions, save_prediction
from analytics import get_monthly_summary, get_category_breakdown

MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models_saved")
os.makedirs(MODELS_DIR, exist_ok=True)

MIN_REQUIRED_MONTHS = 3  # Minimum distinct months needed for reliable ML training


def check_data_sufficiency(user_id: int) -> Tuple[bool, str, pd.DataFrame]:
    """
    Validates whether the user has accumulated enough historical data
    for a meaningful AI prediction.
    """
    monthly_df = get_monthly_summary(user_id)
    
    if monthly_df.empty or len(monthly_df) < MIN_REQUIRED_MONTHS:
        msg = "Not enough historical data for an AI prediction. Continue adding your income and expenses to generate a prediction."
        return False, msg, monthly_df

    # Also verify non-zero expenses exist
    if (monthly_df["Expense"] == 0).all():
        msg = "Not enough expense transactions recorded. Please log your expenses across multiple months."
        return False, msg, monthly_df

    return True, "", monthly_df


def prepare_features(monthly_df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
    """
    Constructs ML feature matrix X and target vector y from monthly financial aggregates.
    """
    df = monthly_df.copy()
    df["month_idx"] = np.arange(len(df))
    
    # Lag and rolling features
    df["lag_expense_1"] = df["Expense"].shift(1).bfill()
    df["rolling_avg_expense"] = df["Expense"].rolling(window=2, min_periods=1).mean()
    df["income_feature"] = df["Income"].values

    feature_cols = ["month_idx", "income_feature", "lag_expense_1", "rolling_avg_expense"]
    X = df[feature_cols]
    y = df["Expense"]
    return X, y


def train_and_evaluate_models(X: pd.DataFrame, y: pd.Series) -> Dict[str, Any]:
    """
    Trains candidate models and selects the best performer based on MAE/RMSE.
    """
    n_samples = len(X)
    candidates = {}

    # Candidate 1: Linear Regression
    lr = LinearRegression()
    lr.fit(X, y)
    lr_pred = lr.predict(X)
    lr_mae = mean_absolute_error(y, lr_pred)
    lr_rmse = math.sqrt(mean_squared_error(y, lr_pred))
    lr_r2 = max(-1.0, r2_score(y, lr_pred))
    candidates["Linear Regression"] = {
        "model": lr,
        "pred": lr_pred,
        "mae": lr_mae,
        "rmse": lr_rmse,
        "r2": lr_r2
    }

    # Candidate 2: Random Forest Regressor
    rf = RandomForestRegressor(n_estimators=30, max_depth=3, random_state=42)
    rf.fit(X, y)
    rf_pred = rf.predict(X)
    rf_mae = mean_absolute_error(y, rf_pred)
    rf_rmse = math.sqrt(mean_squared_error(y, rf_pred))
    rf_r2 = max(-1.0, r2_score(y, rf_pred))
    candidates["Random Forest"] = {
        "model": rf,
        "pred": rf_pred,
        "mae": rf_mae,
        "rmse": rf_rmse,
        "r2": rf_r2
    }

    # Candidate 3: XGBoost (if installed)
    if HAS_XGBOOST and n_samples >= 3:
        try:
            xgb = XGBRegressor(n_estimators=25, max_depth=2, learning_rate=0.1, random_state=42)
            xgb.fit(X, y)
            xgb_pred = xgb.predict(X)
            xgb_mae = mean_absolute_error(y, xgb_pred)
            xgb_rmse = math.sqrt(mean_squared_error(y, xgb_pred))
            xgb_r2 = max(-1.0, r2_score(y, xgb_pred))
            candidates["XGBoost Regressor"] = {
                "model": xgb,
                "pred": xgb_pred,
                "mae": xgb_mae,
                "rmse": xgb_rmse,
                "r2": xgb_r2
            }
        except Exception:
            pass

    # Pick the model with the minimum MAE
    best_name = min(candidates.keys(), key=lambda k: candidates[k]["mae"])
    best_info = candidates[best_name]

    return {
        "best_name": best_name,
        "best_model": best_info["model"],
        "candidates": candidates,
        "best_metrics": {
            "mae": best_info["mae"],
            "rmse": best_info["rmse"],
            "r2": best_info["r2"]
        }
    }


def predict_next_month(user_id: int) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
    """
    Main prediction pipeline:
    1. Loads the logged-in user's transactions.
    2. Validates sufficiency.
    3. Engineers features.
    4. Trains and evaluates candidate models.
    5. Forecasts next month's expected expense and savings.
    6. Identifies spending trend and projected category weights.
    7. Persists model and prediction.
    """
    sufficient, msg, monthly_df = check_data_sufficiency(user_id)
    if not sufficient:
        return False, msg, None

    X, y = prepare_features(monthly_df)
    results = train_and_evaluate_models(X, y)
    best_model = results["best_model"]
    best_name = results["best_name"]
    metrics = results["best_metrics"]

    # Construct feature row for next month (index = len(monthly_df))
    next_idx = len(monthly_df)
    last_row = monthly_df.iloc[-1]
    last_expense = float(last_row["Expense"])
    last_income = float(last_row["Income"])
    recent_rolling = float(monthly_df["Expense"].tail(2).mean())

    # Projected next month income (average of last 3 months or latest)
    expected_income = float(monthly_df["Income"].tail(3).mean())
    if expected_income <= 0:
        expected_income = last_income

    next_X = pd.DataFrame([{
        "month_idx": next_idx,
        "income_feature": expected_income,
        "lag_expense_1": last_expense,
        "rolling_avg_expense": recent_rolling
    }])

    raw_prediction = float(best_model.predict(next_X)[0])
    # Ensure prediction is non-negative and realistic
    predicted_expense = max(0.0, raw_prediction)
    predicted_savings = max(0.0, expected_income - predicted_expense)

    # Determine spending trend (Increasing, Decreasing, or Stable)
    if len(monthly_df) >= 2:
        recent_trend_slope = (predicted_expense - last_expense) / (last_expense if last_expense > 0 else 1.0)
        if recent_trend_slope > 0.04:
            spending_trend = "Increasing"
            trend_description = "Your expenses are projected to rise compared to the recent month."
        elif recent_trend_slope < -0.04:
            spending_trend = "Decreasing"
            trend_description = "Your expenses are projected to decline, indicating improving thriftiness."
        else:
            spending_trend = "Stable"
            trend_description = "Your spending is projected to remain steady."
    else:
        spending_trend = "Stable"
        trend_description = "Stable spending pace projected."

    # Future major category projections
    category_df = get_category_breakdown(user_id, trans_type="Expense")
    future_categories = []
    if not category_df.empty:
        for _, row in category_df.head(4).iterrows():
            projected_cat_amt = (row["percentage"] / 100.0) * predicted_expense
            future_categories.append({
                "category": row["category"],
                "percentage": float(row["percentage"]),
                "projected_amount": projected_cat_amt
            })

    # Save model using joblib strictly under user-specific namespace
    user_model_path = os.path.join(MODELS_DIR, f"user_{user_id}_model.joblib")
    try:
        joblib.dump(best_model, user_model_path)
    except Exception:
        pass

    # Next month label
    last_period = pd.to_datetime(monthly_df["year_month"].iloc[-1] + "-01")
    next_period = last_period + pd.DateOffset(months=1)
    next_month_label = next_period.strftime("%B %Y")
    next_month_str = next_period.strftime("%Y-%m")

    # Persist prediction in database
    try:
        save_prediction(
            user_id=user_id,
            prediction_date=next_month_str,
            predicted_expense=predicted_expense,
            predicted_savings=predicted_savings,
            model_name=best_name
        )
    except Exception:
        pass

    comparison_table = []
    for m_name, m_data in results["candidates"].items():
        comparison_table.append({
            "Model": m_name,
            "MAE (₹)": round(m_data["mae"], 2),
            "RMSE (₹)": round(m_data["rmse"], 2),
            "R² Score": round(m_data["r2"], 3),
            "Selected": "✓ Best Fit" if m_name == best_name else ""
        })

    return True, "", {
        "next_month_label": next_month_label,
        "predicted_expense": predicted_expense,
        "predicted_savings": predicted_savings,
        "expected_income": expected_income,
        "spending_trend": spending_trend,
        "trend_description": trend_description,
        "selected_model": best_name,
        "metrics": metrics,
        "comparison_table": comparison_table,
        "future_categories": future_categories,
        "historical_months_count": len(monthly_df)
    }
