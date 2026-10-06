"""
finpredict_ai/views/profile.py
Profile & Account Management View for FinPredict AI.
Allows viewing stats, updating name/password, and exporting personal records.
"""

import streamlit as st
import pandas as pd
from auth import get_current_user, hash_password, verify_password, logout_user
from database import get_user_stats, update_user_name, update_user_password, get_transactions
from models import format_inr


def render() -> None:
    user = get_current_user()
    if not user:
        st.error("Please login to view your profile.")
        return

    st.markdown("## User Profile & Account")
    st.markdown("<span style='color: #64748b; font-size: 0.95rem;'>Manage your account credentials and view your summary stats.</span>", unsafe_allow_html=True)
    st.write("")

    user_id = user["id"]
    stats = get_user_stats(user_id)

    # Account Overview Box
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("Total Transactions", stats["total_transactions"])
    with col2:
        st.metric("Total Income", format_inr(stats["total_income"]))
    with col3:
        st.metric("Total Expenses", format_inr(stats["total_expenses"]))
    with col4:
        st.metric("Net Balance", format_inr(stats["balance"]))

    st.write("---")

    # User Information & Edit Form
    col_info, col_pwd = st.columns(2)

    with col_info:
        st.markdown("### Profile Details")
        st.write(f"**Email ID:** `{user['email']}`")
        st.write(f"**Account Created:** {user.get('created_at', 'N/A')}")
        st.write(f"**User ID:** `#{user['id']}`")

        st.write("")
        st.markdown("#### Update Name")
        with st.form("update_name_form"):
            new_name = st.text_input("Full Name", value=user["name"])
            name_submitted = st.form_submit_button("Save Name")
            if name_submitted:
                if len(new_name.strip()) < 2:
                    st.error("Name must be at least 2 characters.")
                else:
                    success = update_user_name(user_id, new_name.strip())
                    if success:
                        st.session_state["user"]["name"] = new_name.strip()
                        st.success("✓ Name updated successfully.")
                        st.rerun()
                    else:
                        st.error("Could not update name.")

    with col_pwd:
        st.markdown("### Security & Password")
        with st.form("change_password_form"):
            new_pwd = st.text_input("New Password", type="password")
            confirm_pwd = st.text_input("Confirm New Password", type="password")
            pwd_submitted = st.form_submit_button("Update Password")
            if pwd_submitted:
                if len(new_pwd) < 6:
                    st.error("Password must be at least 6 characters.")
                elif new_pwd != confirm_pwd:
                    st.error("Passwords do not match.")
                else:
                    new_hash = hash_password(new_pwd)
                    if update_user_password(user_id, new_hash):
                        st.success("✓ Password changed successfully.")
                    else:
                        st.error("Failed to update password.")

    st.write("---")

    # Data Export Section
    st.markdown("### Export My Data")
    st.write("Download a CSV backup of all transactions registered to your account:")
    records = get_transactions(user_id)
    if records:
        df = pd.DataFrame(records)
        # Drop internal foreign key if desired or keep clean columns
        csv_data = df.to_csv(index=False).encode("utf-8")
        st.download_button(
            label="📥 Download Transactions as CSV",
            data=csv_data,
            file_name=f"finpredict_{user['email']}_transactions.csv",
            mime="text/csv"
        )
    else:
        st.caption("No transactions to export yet.")
