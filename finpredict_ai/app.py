"""
finpredict_ai/app.py
Main Streamlit application entry point for "AI-Based Personal Finance Prediction".
"""

import streamlit as st

# Configure wide layout and page metadata
st.set_page_config(
    page_title="AI-Based Personal Finance Prediction",
    page_icon="₹",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Explicitly import modular views to avoid NameError
from views import dashboard
from views import transactions
from views import analytics
from views import predictor
from views import profile

from auth import (
    init_session_state,
    is_authenticated,
    get_current_user,
    login_user,
    logout_user,
    hash_password,
    verify_password,
    validate_registration_inputs
)
from database import get_user_by_email, create_user


# Global Indian Finance UI Theme Styling
st.markdown("""
<style>
    /* Styling for financial application typography and metrics */
    .stApp {
        background-color: #f8fafc;
        color: #0f172a;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    div[data-testid="stMetric"] {
        background-color: #ffffff;
        border: 1px solid #e2e8f0;
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }
    div[data-testid="stMetricLabel"] p {
        font-size: 0.82rem !important;
        font-weight: 600 !important;
        color: #64748b !important;
        text-transform: uppercase;
        letter-spacing: 0.04em;
    }
    div[data-testid="stMetricValue"] {
        font-family: "JetBrains Mono", monospace, -apple-system !important;
        font-variant-numeric: tabular-nums;
        font-weight: 700 !important;
        color: #0f172a !important;
    }
    .user-pill {
        background: #e0f2fe;
        color: #0369a1;
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 0.85rem;
        font-weight: 500;
        display: inline-block;
        margin-bottom: 12px;
    }
</style>
""", unsafe_allow_html=True)


def render_auth_screen() -> None:
    """Renders Login & Registration tabs when unauthenticated."""
    st.markdown("<h1 style='text-align: center; margin-bottom: 4px;'>AI-Based Personal Finance Prediction</h1>", unsafe_allow_html=True)
    st.markdown("<p style='text-align: center; color: #64748b;'>Indian Personal Finance Management with Machine Learning Forecasting · ₹ INR</p>", unsafe_allow_html=True)
    st.write("")

    col_space_l, col_center, col_space_r = st.columns([1, 1.2, 1])

    with col_center:
        auth_tab_login, auth_tab_register = st.tabs(["🔐 Sign In", "📝 Create Account"])

        # ======================================================================
        # LOGIN TAB
        # ======================================================================
        with auth_tab_login:
            st.markdown("### Log in to Your Account")
            with st.form("login_form"):
                login_email = st.text_input("Email ID", placeholder="you@example.com").strip()
                login_password = st.text_input("Password", type="password")
                login_submit = st.form_submit_button("Sign In", use_container_width=True, type="primary")

                if login_submit:
                    if not login_email or not login_password:
                        st.error("Please enter both email and password.")
                    else:
                        user = get_user_by_email(login_email)
                        if user and verify_password(user["password_hash"], login_password):
                            login_user(user)
                            st.success(f"Welcome back, {user['name']}!")
                            st.rerun()
                        else:
                            st.error("Invalid email or password. Please try again.")

        # ======================================================================
        # REGISTRATION TAB
        # ======================================================================
        with auth_tab_register:
            st.markdown("### Register New Account")
            with st.form("register_form"):
                reg_name = st.text_input("Full Name", placeholder="e.g. Rahul Sharma")
                reg_email = st.text_input("Email ID", placeholder="rahul@example.com").strip()
                reg_pass = st.text_input("Password (min 6 characters)", type="password")
                reg_confirm = st.text_input("Confirm Password", type="password")
                reg_submit = st.form_submit_button("Register Account", use_container_width=True, type="primary")

                if reg_submit:
                    is_valid, err_msg = validate_registration_inputs(reg_name, reg_email, reg_pass, reg_confirm)
                    if not is_valid:
                        st.error(err_msg)
                    else:
                        # Check existing
                        existing = get_user_by_email(reg_email)
                        if existing:
                            st.error("An account with this email already exists. Please sign in instead.")
                        else:
                            pwd_hash = hash_password(reg_pass)
                            new_id = create_user(reg_name, reg_email, pwd_hash)
                            if new_id:
                                new_user = get_user_by_email(reg_email)
                                if new_user:
                                    login_user(new_user)
                                    st.success("Account created successfully! Welcome to FinPredict AI.")
                                    st.rerun()
                            else:
                                st.error("Failed to create account. Please try again.")


def main() -> None:
    init_session_state()

    if not is_authenticated():
        render_auth_screen()
        return

    # Authenticated User Session
    user = get_current_user()
    if not user:
        render_auth_screen()
        return

    # Sidebar Navigation
    with st.sidebar:
        st.markdown(f"### FinPredict AI")
        st.markdown(f"<div class='user-pill'>👤 {user['name']}<br><span style='font-size:0.75rem; color:#475569;'>{user['email']}</span></div>", unsafe_allow_html=True)

        st.markdown("---")
        nav_choice = st.radio(
            "Navigation",
            options=["Dashboard", "Transactions", "Analytics", "AI Predictor", "Profile"],
            index=0
        )

        st.markdown("---")
        if st.button("🚪 Logout", use_container_width=True):
            logout_user()
            st.rerun()

    # Routing to views
    if nav_choice == "Dashboard":
        dashboard.render()
    elif nav_choice == "Transactions":
        transactions.render()
    elif nav_choice == "Analytics":
        analytics.render()
    elif nav_choice == "AI Predictor":
        predictor.render()
    elif nav_choice == "Profile":
        profile.render()


if __name__ == "__main__":
    main()
