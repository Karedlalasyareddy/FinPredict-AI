"""
finpredict_ai/views/analytics.py
Analytics View for FinPredict AI.
Renders income/expense trends, category distributions, savings metrics, and monthly changes.
"""

import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
from auth import get_current_user
from analytics import (
    get_monthly_summary,
    get_category_breakdown,
    get_analytics_metrics,
    generate_financial_insights
)
from models import format_inr


def render() -> None:
    user = get_current_user()
    if not user:
        st.error("Please login to view analytics.")
        return

    st.markdown("## Financial Analytics")
    st.markdown("<span style='color: #64748b; font-size: 0.95rem;'>Deep dive into your cash flows, spending patterns, and category allocations.</span>", unsafe_allow_html=True)
    st.write("")

    user_id = user["id"]
    metrics = get_analytics_metrics(user_id)
    monthly_df = get_monthly_summary(user_id)

    if not metrics["has_data"] or monthly_df.empty:
        st.info("No financial data available yet. Add your income and expenses to start your analysis.")
        return

    # Metric Cards Row
    c1, c2, c3, c4 = st.columns(4)
    with c1:
        st.metric("Avg. Monthly Income", format_inr(metrics["avg_monthly_income"]))
    with c2:
        st.metric("Avg. Monthly Expense", format_inr(metrics["avg_monthly_expense"]))
    with c3:
        st.metric("Overall Savings Rate", f"{metrics['savings_rate']:.1f}%")
    with c4:
        delta_str = f"{metrics['month_change_pct']:+.1f}% vs last month" if len(monthly_df) >= 2 else "Baseline"
        st.metric(
            "Highest Spending Category",
            metrics["highest_category"] or "None",
            delta=delta_str
        )

    st.write("---")

    # Chart 1: Income vs Expenses Over Time
    st.markdown("### Monthly Cash Flow Trends")
    fig, ax = plt.subplots(figsize=(10, 4.2))
    fig.patch.set_facecolor("white")
    ax.set_facecolor("#f8fafc")

    x_indices = np.arange(len(monthly_df))
    bar_width = 0.35

    ax.bar(x_indices - bar_width/2, monthly_df["Income"], width=bar_width, label="Income (₹)", color="#10b981", alpha=0.9)
    ax.bar(x_indices + bar_width/2, monthly_df["Expense"], width=bar_width, label="Expense (₹)", color="#ef4444", alpha=0.9)

    ax.set_xticks(x_indices)
    ax.set_xticklabels(monthly_df["month_label"], rotation=25, ha="right", fontsize=9)
    ax.set_ylabel("Amount in ₹", fontsize=10)
    ax.grid(axis="y", linestyle="--", alpha=0.4)
    ax.legend(frameon=True, facecolor="white")
    fig.tight_layout()
    st.pyplot(fig)
    plt.close(fig)

    st.write("")

    # Chart 2 & 3: Savings Trend and Category Breakdown
    c_left, c_right = st.columns([1, 1])

    with c_left:
        st.markdown("### Monthly Savings Trend")
        fig_sav, ax_sav = plt.subplots(figsize=(6, 4))
        fig_sav.patch.set_facecolor("white")
        ax_sav.set_facecolor("#f8fafc")

        ax_sav.plot(monthly_df["month_label"], monthly_df["Savings"], marker="o", color="#2563eb", linewidth=2.5)
        ax_sav.axhline(0, color="#94a3b8", linestyle="--", alpha=0.7)
        ax_sav.fill_between(monthly_df["month_label"], monthly_df["Savings"], 0, where=(monthly_df["Savings"] >= 0), color="#3b82f6", alpha=0.15)
        ax_sav.fill_between(monthly_df["month_label"], monthly_df["Savings"], 0, where=(monthly_df["Savings"] < 0), color="#ef4444", alpha=0.15)

        ax_sav.set_xticklabels(monthly_df["month_label"], rotation=30, ha="right", fontsize=8)
        ax_sav.set_ylabel("Net Savings (₹)", fontsize=9)
        ax_sav.grid(axis="y", linestyle="--", alpha=0.4)
        fig_sav.tight_layout()
        st.pyplot(fig_sav)
        plt.close(fig_sav)

    with c_right:
        st.markdown("### Category-Wise Expense Share")
        cat_df = get_category_breakdown(user_id, trans_type="Expense")
        if not cat_df.empty:
            fig_bar, ax_bar = plt.subplots(figsize=(6, 4))
            fig_bar.patch.set_facecolor("white")
            ax_bar.set_facecolor("#f8fafc")

            bars = ax_bar.barh(cat_df["category"][:8], cat_df["total_amount"][:8], color="#6366f1")
            ax_bar.set_xlabel("Total Spend (₹)", fontsize=9)
            ax_bar.invert_yaxis()
            ax_bar.grid(axis="x", linestyle="--", alpha=0.4)
            fig_bar.tight_layout()
            st.pyplot(fig_bar)
            plt.close(fig_bar)
        else:
            st.write("No expense records logged.")

    st.write("---")

    # Monthly Summary Data Table
    st.markdown("### Monthly Financial Breakdown Table")
    display_summary = monthly_df.copy()
    display_summary["Income"] = display_summary["Income"].apply(format_inr)
    display_summary["Expense"] = display_summary["Expense"].apply(format_inr)
    display_summary["Savings"] = display_summary["Savings"].apply(format_inr)
    display_summary["Savings_Rate"] = display_summary["Savings_Rate"].apply(lambda v: f"{v:.1f}%")
    display_summary = display_summary.rename(columns={
        "month_label": "Month",
        "Income": "Total Income (₹)",
        "Expense": "Total Expense (₹)",
        "Savings": "Net Savings (₹)",
        "Savings_Rate": "Savings Rate"
    })[["Month", "Total Income (₹)", "Total Expense (₹)", "Net Savings (₹)", "Savings Rate"]]
    st.dataframe(display_summary, use_container_width=True, hide_index=True)

    # Section 6: AI Financial Insights
    st.write("")
    st.markdown("### Financial Health Observations")
    insights = generate_financial_insights(user_id)
    for item in insights:
        itype = item["type"]
        if itype == "alert" or itype == "warning":
            st.warning(f"**{item['title']}**: {item['message']}")
        elif itype == "success":
            st.success(f"**{item['title']}**: {item['message']}")
        else:
            st.info(f"**{item['title']}**: {item['message']}")
