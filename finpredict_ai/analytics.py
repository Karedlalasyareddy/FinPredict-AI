"""
finpredict_ai/analytics.py
Financial calculations, metrics, trends, and rule-based insights.
Calculations are strictly computed from the logged-in user's stored data.
"""

from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np
from database import get_transactions
from models import format_inr


def get_user_dataframe(user_id: int) -> pd.DataFrame:
    """Loads all transactions of the user into a structured Pandas DataFrame."""
    records = get_transactions(user_id)
    if not records:
        return pd.DataFrame(columns=[
            "id", "user_id", "date", "type", "category", "amount", "description", "payment_method", "created_at"
        ])
    df = pd.DataFrame(records)
    df["date"] = pd.to_datetime(df["date"])
    df["amount"] = pd.to_numeric(df["amount"])
    df["year_month"] = df["date"].dt.strftime("%Y-%m")
    df["month_label"] = df["date"].dt.strftime("%b %Y")
    return df


def compute_dashboard_metrics(user_id: int) -> Dict[str, Any]:
    """Computes headline financial figures for the dashboard."""
    df = get_user_dataframe(user_id)
    if df.empty:
        return {
            "has_data": False,
            "total_income": 0.0,
            "total_expenses": 0.0,
            "balance": 0.0,
            "savings": 0.0,
            "savings_pct": 0.0,
            "monthly_income": 0.0,
            "monthly_expenses": 0.0,
            "recent_month": None,
            "transaction_count": 0
        }

    total_income = float(df[df["type"] == "Income"]["amount"].sum())
    total_expenses = float(df[df["type"] == "Expense"]["amount"].sum())
    balance = total_income - total_expenses
    savings = max(0.0, balance)
    savings_pct = (savings / total_income * 100) if total_income > 0 else 0.0

    # Current/latest month metrics
    latest_month = df["year_month"].max()
    latest_df = df[df["year_month"] == latest_month]
    monthly_income = float(latest_df[latest_df["type"] == "Income"]["amount"].sum())
    monthly_expenses = float(latest_df[latest_df["type"] == "Expense"]["amount"].sum())

    return {
        "has_data": True,
        "total_income": total_income,
        "total_expenses": total_expenses,
        "balance": balance,
        "savings": savings,
        "savings_pct": savings_pct,
        "monthly_income": monthly_income,
        "monthly_expenses": monthly_expenses,
        "recent_month": latest_df["month_label"].iloc[0] if not latest_df.empty else None,
        "transaction_count": len(df)
    }


def get_monthly_summary(user_id: int) -> pd.DataFrame:
    """
    Returns monthly aggregated income, expense, and savings.
    """
    df = get_user_dataframe(user_id)
    if df.empty:
        return pd.DataFrame(columns=["year_month", "month_label", "Income", "Expense", "Savings", "Savings_Rate"])

    # Pivot table by year_month and type
    pivot = df.pivot_table(
        index=["year_month"],
        columns="type",
        values="amount",
        aggfunc="sum",
        fill_value=0.0
    ).reset_index()

    if "Income" not in pivot.columns:
        pivot["Income"] = 0.0
    if "Expense" not in pivot.columns:
        pivot["Expense"] = 0.0

    pivot["Savings"] = pivot["Income"] - pivot["Expense"]
    pivot["Savings_Rate"] = pivot.apply(
        lambda r: (r["Savings"] / r["Income"] * 100) if r["Income"] > 0 else 0.0, axis=1
    )
    pivot = pivot.sort_values("year_month")
    
    # Add display month label
    pivot["month_label"] = pd.to_datetime(pivot["year_month"] + "-01").dt.strftime("%b %Y")
    return pivot


def get_category_breakdown(user_id: int, trans_type: str = "Expense") -> pd.DataFrame:
    """Computes category-wise totals and percentage distribution."""
    df = get_user_dataframe(user_id)
    if df.empty:
        return pd.DataFrame(columns=["category", "total_amount", "percentage"])

    type_df = df[df["type"] == trans_type]
    if type_df.empty:
        return pd.DataFrame(columns=["category", "total_amount", "percentage"])

    cat_group = type_df.groupby("category")["amount"].sum().reset_index()
    cat_group.columns = ["category", "total_amount"]
    total = cat_group["total_amount"].sum()
    cat_group["percentage"] = (cat_group["total_amount"] / total * 100) if total > 0 else 0.0
    cat_group = cat_group.sort_values("total_amount", ascending=False)
    return cat_group


def get_analytics_metrics(user_id: int) -> Dict[str, Any]:
    """Computes detailed analytical indicators."""
    monthly_df = get_monthly_summary(user_id)
    category_df = get_category_breakdown(user_id, trans_type="Expense")

    if monthly_df.empty:
        return {
            "has_data": False,
            "avg_monthly_income": 0.0,
            "avg_monthly_expense": 0.0,
            "highest_category": None,
            "highest_category_amount": 0.0,
            "savings_rate": 0.0,
            "month_change_pct": 0.0
        }

    avg_monthly_income = float(monthly_df["Income"].mean())
    avg_monthly_expense = float(monthly_df["Expense"].mean())
    total_inc = monthly_df["Income"].sum()
    total_sav = monthly_df["Savings"].sum()
    overall_savings_rate = (total_sav / total_inc * 100) if total_inc > 0 else 0.0

    highest_cat = None
    highest_cat_amt = 0.0
    if not category_df.empty:
        highest_cat = category_df.iloc[0]["category"]
        highest_cat_amt = float(category_df.iloc[0]["total_amount"])

    # Month over month expense change
    month_change_pct = 0.0
    if len(monthly_df) >= 2:
        last_exp = monthly_df.iloc[-1]["Expense"]
        prev_exp = monthly_df.iloc[-2]["Expense"]
        if prev_exp > 0:
            month_change_pct = ((last_exp - prev_exp) / prev_exp) * 100

    return {
        "has_data": True,
        "avg_monthly_income": avg_monthly_income,
        "avg_monthly_expense": avg_monthly_expense,
        "highest_category": highest_cat,
        "highest_category_amount": highest_cat_amt,
        "savings_rate": overall_savings_rate,
        "month_change_pct": month_change_pct
    }


def generate_financial_insights(user_id: int) -> List[Dict[str, str]]:
    """
    Generates educational, actionable, and data-grounded financial insights.
    Does not make speculative or guaranteed investment claims.
    """
    monthly_df = get_monthly_summary(user_id)
    category_df = get_category_breakdown(user_id, trans_type="Expense")
    insights = []

    if monthly_df.empty:
        return [{
            "type": "info",
            "title": "Welcome to Your Financial Journey",
            "message": "Add your income and expenses to unlock real-time financial health insights."
        }]

    # Insight 1: Month-over-Month Expense Trend
    if len(monthly_df) >= 2:
        latest = monthly_df.iloc[-1]
        previous = monthly_df.iloc[-2]
        prev_exp = previous["Expense"]
        curr_exp = latest["Expense"]

        if prev_exp > 0:
            pct_change = ((curr_exp - prev_exp) / prev_exp) * 100
            if pct_change > 5:
                insights.append({
                    "type": "warning",
                    "title": "Spending Increased This Month",
                    "message": f"Your expenses increased by {abs(pct_change):.1f}% compared to {previous['month_label']} ({format_inr(curr_exp)} vs {format_inr(prev_exp)}). Review discretionary purchases."
                })
            elif pct_change < -5:
                insights.append({
                    "type": "success",
                    "title": "Great Spending Discipline",
                    "message": f"Your monthly spending decreased by {abs(pct_change):.1f}% compared to {previous['month_label']}. You conserved more capital this month."
                })
            else:
                insights.append({
                    "type": "info",
                    "title": "Stable Spending Pattern",
                    "message": f"Your monthly expenditure is consistent with last month ({format_inr(curr_exp)})."
                })

    # Insight 2: Category Concentration
    if not category_df.empty:
        top_cat = category_df.iloc[0]
        top_name = top_cat["category"]
        top_pct = top_cat["percentage"]
        top_amt = top_cat["total_amount"]

        if top_pct >= 35:
            insights.append({
                "type": "warning",
                "title": f"High Concentration in {top_name}",
                "message": f"{top_name} accounts for {top_pct:.1f}% of all your expenses ({format_inr(top_amt)}). Look for potential optimizations or bundle deals."
            })
        else:
            insights.append({
                "type": "info",
                "title": "Well-Distributed Expenses",
                "message": f"Your largest expense category is {top_name} at {top_pct:.1f}%, showing a balanced distribution across categories."
            })

    # Insight 3: Savings Health
    tot_inc = monthly_df["Income"].sum()
    tot_exp = monthly_df["Expense"].sum()
    net_bal = tot_inc - tot_exp

    if tot_inc > 0:
        overall_sav_rate = (net_bal / tot_inc) * 100
        if overall_sav_rate < 0:
            insights.append({
                "type": "alert",
                "title": "Expense Deficit Warning",
                "message": f"Total expenses exceed your total income by {format_inr(abs(net_bal))}. Consider auditing subscriptions, dining, and non-essential outflows."
            })
        elif overall_sav_rate < 15:
            insights.append({
                "type": "warning",
                "title": "Moderate Savings Cushion",
                "message": f"Your overall savings rate is {overall_sav_rate:.1f}%. Financial planners generally recommend aiming for a 20% savings buffer where possible."
            })
        else:
            insights.append({
                "type": "success",
                "title": "Strong Savings Health",
                "message": f"You are saving {overall_sav_rate:.1f}% of your earnings! Maintaining this discipline builds a healthy emergency safety net."
            })

    return insights
