"""
finpredict_ai/views/predictor.py
AI Finance Predictor View for FinPredict AI.
Renders machine learning models, forecast results, evaluation metrics, and insights.
"""

import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
from auth import get_current_user
from predictor import predict_next_month, check_data_sufficiency
from analytics import generate_financial_insights
from models import format_inr


def render() -> None:
    user = get_current_user()
    if not user:
        st.error("Please login to access the AI Predictor.")
        return

    st.markdown("## AI Finance Predictor")
    st.markdown("<span style='color: #64748b; font-size: 0.95rem;'>Machine learning models trained on your personal financial data to project future expenses and savings.</span>", unsafe_allow_html=True)
    st.write("")

    user_id = user["id"]
    sufficient, msg, monthly_df = check_data_sufficiency(user_id)

    if not sufficient:
        st.warning(f"⚠️ {msg}")
        st.info(
            "**Why is more data needed?**\n"
            "Machine learning algorithms (such as Linear Regression, Random Forest, and XGBoost) calculate lag correlations, moving averages, and seasonal patterns. "
            f"Currently, your account has records across **{len(monthly_df)} month(s)**. Once you have logged income and expenses across at least 3 distinct months, the AI engine will activate automatically."
        )
        return

    # Trigger action
    st.write("Click the button below to train candidate models on your financial history and forecast your next month's finances:")
    train_clicked = st.button("🚀 Train & Run AI Prediction Model", type="primary", use_container_width=True)

    # Check if prediction was run or stored in session
    session_key = f"last_prediction_res_{user_id}"
    if train_clicked:
        with st.spinner("Training scikit-learn & XGBoost regression models on your transactions..."):
            success, err_msg, result = predict_next_month(user_id)
            if success and result:
                st.session_state[session_key] = result
                st.success(f"✓ AI Models trained successfully! Best performing algorithm: **{result['selected_model']}**")
            else:
                st.error(err_msg)

    result = st.session_state.get(session_key, None)

    # If not yet clicked in session, try running automatically if sufficient
    if not result:
        success, _, result = predict_next_month(user_id)
        if success and result:
            st.session_state[session_key] = result

    if not result:
        return

    st.write("---")

    # Headline Forecast Banner
    st.markdown(f"### Forecast for {result['next_month_label']}")
    col_exp, col_sav, col_trend, col_model = st.columns(4)

    with col_exp:
        st.metric(
            label="Projected Expenses",
            value=format_inr(result["predicted_expense"])
        )
    with col_sav:
        st.metric(
            label="Projected Savings",
            value=format_inr(result["predicted_savings"])
        )
    with col_trend:
        trend = result["spending_trend"]
        color = "#dc2626" if trend == "Increasing" else ("#059669" if trend == "Decreasing" else "#2563eb")
        st.markdown(f"**Spending Trend**<br><span style='font-size: 1.4rem; color: {color}; font-weight: 700;'>{trend}</span>", unsafe_allow_html=True)
        st.caption(result["trend_description"])
    with col_model:
        st.metric(
            label="Selected Model",
            value=result["selected_model"]
        )

    st.write("---")

    # Model Evaluation & Comparison Table
    col_metrics, col_categories = st.columns([1.1, 1])

    with col_metrics:
        st.markdown("### Model Benchmark & Evaluation")
        st.caption("Models evaluated using Mean Absolute Error (MAE), Root Mean Squared Error (RMSE), and R² Coefficient:")
        comp_df = pd.DataFrame(result["comparison_table"])
        st.dataframe(comp_df, use_container_width=True, hide_index=True)

        best_m = result["metrics"]
        st.markdown(
            f"- **Validation MAE:** ₹{best_m['mae']:,.2f} *(Average expected variance)*\n"
            f"- **Validation RMSE:** ₹{best_m['rmse']:,.2f}\n"
            f"- **R² Fit Score:** {best_m['r2']:.3f}\n"
        )

    with col_categories:
        st.markdown("### Major Future Expense Categories")
        st.caption("Projected allocation based on your recurring spending patterns:")
        future_cats = result.get("future_categories", [])
        if future_cats:
            cat_table = []
            for item in future_cats:
                cat_table.append({
                    "Category": item["category"],
                    "Projected Share": f"{item['percentage']:.1f}%",
                    "Expected Outflow (₹)": format_inr(item["projected_amount"])
                })
            st.dataframe(pd.DataFrame(cat_table), use_container_width=True, hide_index=True)
        else:
            st.write("No categorical records found.")

    st.write("---")

    # AI Financial Insights
    st.markdown("### AI Financial Health Insights")
    insights = generate_financial_insights(user_id)
    for item in insights:
        itype = item["type"]
        if itype == "alert" or itype == "warning":
            st.warning(f"**{item['title']}**: {item['message']}")
        elif itype == "success":
            st.success(f"**{item['title']}**: {item['message']}")
        else:
            st.info(f"**{item['title']}**: {item['message']}")

    st.caption("Note: All AI predictions and insights are for educational budget awareness and personal tracking. They do not constitute certified financial or investment advice.")
