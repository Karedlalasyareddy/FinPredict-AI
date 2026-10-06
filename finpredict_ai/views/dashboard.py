"""
finpredict_ai/views/dashboard.py
Personal Dashboard View for FinPredict AI.
Renders real-time financial overview strictly derived from user's entered data.
"""

import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
from auth import get_current_user
from analytics import compute_dashboard_metrics, get_category_breakdown, get_monthly_summary
from database import get_transactions, get_latest_prediction
from models import format_inr


def render() -> None:
    user = get_current_user()
    if not user:
        st.error("Please login to access your dashboard.")
        return

    st.markdown(f"## Welcome, {user['name']}")
    st.markdown(f"<span style='color: #64748b; font-size: 0.95rem;'>Account: {user['email']} · Financial Dashboard</span>", unsafe_allow_html=True)
    st.write("")

    metrics = compute_dashboard_metrics(user["id"])

    # Enforce strict empty state if user has no transactions yet
    if not metrics["has_data"]:
        st.info("No financial data available yet. Add your income and expenses to start your analysis.")
        st.write("Head to the **Transactions** tab on the left to add your first income or expense entry.")
        return

    # Top KPI Metrics Row 1: Overall Totals
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric(
            label="Total Income",
            value=format_inr(metrics["total_income"])
        )
    with col2:
        st.metric(
            label="Total Expenses",
            value=format_inr(metrics["total_expenses"])
        )
    with col3:
        st.metric(
            label="Current Balance",
            value=format_inr(metrics["balance"])
        )
    with col4:
        st.metric(
            label="Savings Rate",
            value=f"{metrics['savings_pct']:.1f}%"
        )

    # Secondary KPI Row: Latest Monthly Activity
    st.write("")
    st.markdown("### Monthly Financial Pulse")
    m_col1, m_col2, m_col3 = st.columns(3)
    with m_col1:
        st.metric(
            label=f"Monthly Income ({metrics['recent_month'] or 'Recent'})",
            value=format_inr(metrics["monthly_income"])
        )
    with m_col2:
        st.metric(
            label=f"Monthly Expenses ({metrics['recent_month'] or 'Recent'})",
            value=format_inr(metrics["monthly_expenses"])
        )
    with m_col3:
        monthly_net = metrics["monthly_income"] - metrics["monthly_expenses"]
        st.metric(
            label="Monthly Net Savings",
            value=format_inr(monthly_net),
            delta=f"{format_inr(monthly_net)} saved" if monthly_net >= 0 else f"-{format_inr(abs(monthly_net))} deficit"
        )

    st.write("---")

    # Layout: Category Breakdown & AI Prediction Summary
    left_col, right_col = st.columns([1, 1])

    with left_col:
        st.markdown("### Expense Category Breakdown")
        cat_df = get_category_breakdown(user["id"], trans_type="Expense")
        if not cat_df.empty:
            fig, ax = plt.subplots(figsize=(5, 3.5))
            fig.patch.set_facecolor("none")
            ax.set_facecolor("none")
            colors = ["#2563eb", "#059669", "#d97706", "#dc2626", "#7c3aed", "#0891b2", "#475569"]
            ax.pie(
                cat_df["total_amount"],
                labels=cat_df["category"],
                autopct="%1.1f%%",
                startangle=140,
                colors=colors[:len(cat_df)],
                textprops={"fontsize": 9}
            )
            ax.axis("equal")
            st.pyplot(fig)
            plt.close(fig)
        else:
            st.write("No expense records logged yet.")

    with right_col:
        st.markdown("### AI Prediction Summary")
        latest_pred = get_latest_prediction(user["id"])
        if latest_pred:
            st.success(f"**Forecast for {latest_pred['prediction_date']}**")
            st.write(f"- **Expected Expenses:** {format_inr(latest_pred['predicted_expense'])}")
            st.write(f"- **Expected Savings:** {format_inr(latest_pred['predicted_savings'])}")
            st.write(f"- **Model Selected:** `{latest_pred['model_name']}`")
            st.caption(f"Generated at: {latest_pred['created_at']}")
        else:
            st.info("No AI predictions generated yet.")
            st.write("Visit the **AI Predictor** section to train a machine learning model on your monthly financial data.")

    st.write("---")

    # Recent Transactions Section
    st.markdown("### Recent Transactions")
    recent = get_transactions(user["id"])[:8]
    if recent:
        table_rows = []
        for r in recent:
            table_rows.append({
                "Date": r["date"],
                "Type": r["type"],
                "Category": r["category"],
                "Amount": format_inr(r["amount"]),
                "Payment Method": r["payment_method"] or "-",
                "Description": r["description"] or "-"
            })
        st.dataframe(pd.DataFrame(table_rows), use_container_width=True, hide_index=True)
    else:
        st.write("No recent transactions.")
