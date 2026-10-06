"""
finpredict_ai/views/transactions.py
Transaction Management View for FinPredict AI.
Handles Add, Edit, Delete, Search, and Filtering with strict user isolation.
"""

import streamlit as st
import pandas as pd
from datetime import date
from auth import get_current_user
from database import (
    add_transaction,
    get_transactions,
    get_transaction_by_id,
    update_transaction,
    delete_transaction,
    get_user_categories
)
from models import (
    DEFAULT_EXPENSE_CATEGORIES,
    DEFAULT_INCOME_CATEGORIES,
    ALL_SUGGESTED_CATEGORIES,
    PAYMENT_METHODS,
    TRANSACTION_TYPES,
    format_inr
)


def render() -> None:
    user = get_current_user()
    if not user:
        st.error("Please login to manage transactions.")
        return

    st.markdown("## Transaction Management")
    st.markdown("<span style='color: #64748b; font-size: 0.95rem;'>Log your income and expenses in ₹ INR. All entries are stored securely under your account.</span>", unsafe_allow_html=True)
    st.write("")

    user_id = user["id"]
    existing_user_cats = get_user_categories(user_id)
    combined_cats = sorted(list(set(ALL_SUGGESTED_CATEGORIES + existing_user_cats)))

    # Tab interface: View & Manage vs Add New
    tab_view, tab_add = st.tabs(["📋 View & Manage Transactions", "➕ Add New Transaction"])

    # ==========================================================================
    # TAB: ADD TRANSACTION
    # ==========================================================================
    with tab_add:
        st.markdown("### Add New Entry")
        with st.form("add_transaction_form", clear_on_submit=True):
            col_type, col_date, col_amount = st.columns(3)
            with col_type:
                trans_type = st.selectbox("Transaction Type", TRANSACTION_TYPES, index=0)
            with col_date:
                trans_date = st.date_input("Date", value=date.today())
            with col_amount:
                amount = st.number_input("Amount (₹ INR)", min_value=0.01, step=100.0, format="%.2f")

            col_cat, col_custom, col_method = st.columns(3)
            with col_cat:
                category_choice = st.selectbox(
                    "Category",
                    combined_cats + ["Custom (Create New)"]
                )
            with col_custom:
                custom_cat = st.text_input("New Category (if Custom selected)", placeholder="e.g. Gym, Pet Care")
            with col_method:
                payment_method = st.selectbox("Payment Method", PAYMENT_METHODS, index=0)

            description = st.text_input("Description / Notes", placeholder="e.g. Monthly apartment maintenance bill")

            submitted = st.form_submit_button("Save Transaction", use_container_width=True)
            if submitted:
                # Validation
                final_cat = custom_cat.strip() if category_choice == "Custom (Create New)" and custom_cat.strip() else category_choice
                if category_choice == "Custom (Create New)" and not custom_cat.strip():
                    st.error("Please enter a name for your custom category.")
                elif amount <= 0:
                    st.error("Amount must be greater than zero.")
                else:
                    try:
                        add_transaction(
                            user_id=user_id,
                            date=trans_date.strftime("%Y-%m-%d"),
                            trans_type=trans_type,
                            category=final_cat,
                            amount=float(amount),
                            description=description.strip(),
                            payment_method=payment_method
                        )
                        st.success(f"✓ Successfully added {trans_type} of {format_inr(amount)} in '{final_cat}'!")
                        st.rerun()
                    except Exception as err:
                        st.error(f"Failed to record transaction: {err}")

    # ==========================================================================
    # TAB: VIEW, FILTER, SEARCH, EDIT & DELETE
    # ==========================================================================
    with tab_view:
        # Search & Filters Bar
        st.markdown("#### Search & Filters")
        f_col1, f_col2, f_col3, f_col4 = st.columns([1.5, 1, 1, 1.5])
        with f_col1:
            search_query = st.text_input("Search", placeholder="Search description, category...", label_visibility="collapsed")
        with f_col2:
            type_filter = st.selectbox("Type", ["All", "Income", "Expense"], label_visibility="collapsed")
        with f_col3:
            cat_filter = st.selectbox("Category", ["All"] + combined_cats, label_visibility="collapsed")
        with f_col4:
            date_range = st.date_input("Date Range", value=[], label_visibility="collapsed")

        start_date_str = None
        end_date_str = None
        if isinstance(date_range, (list, tuple)) and len(date_range) == 2:
            start_date_str = date_range[0].strftime("%Y-%m-%d")
            end_date_str = date_range[1].strftime("%Y-%m-%d")

        records = get_transactions(
            user_id=user_id,
            start_date=start_date_str,
            end_date=end_date_str,
            trans_type=type_filter,
            category=cat_filter,
            search=search_query
        )

        if not records:
            st.info("No matching transactions found. Try adjusting your filters or adding a new transaction.")
            return

        st.caption(f"Showing {len(records)} transaction(s)")

        # Render list of transactions with individual Edit and Delete triggers
        for row in records:
            tid = row["id"]
            with st.container():
                c_date, c_type, c_cat, c_amt, c_desc, c_actions = st.columns([1, 0.8, 1.2, 1.2, 1.8, 1])
                with c_date:
                    st.write(f"**{row['date']}**")
                with c_type:
                    color = "#059669" if row["type"] == "Income" else "#dc2626"
                    st.markdown(f"<span style='color: {color}; font-weight: 600;'>{row['type']}</span>", unsafe_allow_html=True)
                with c_cat:
                    st.write(f"{row['category']}")
                with c_amt:
                    st.write(f"**{format_inr(row['amount'])}**")
                with c_desc:
                    desc_text = row["description"] or "-"
                    if row["payment_method"]:
                        desc_text += f" ({row['payment_method']})"
                    st.write(desc_text)
                with c_actions:
                    btn_edit, btn_del = st.columns(2)
                    with btn_edit:
                        if st.button("✏️", key=f"edit_btn_{tid}", help="Edit transaction"):
                            st.session_state[f"editing_{tid}"] = True
                    with btn_del:
                        if st.button("🗑️", key=f"del_btn_{tid}", help="Delete transaction"):
                            st.session_state[f"confirm_del_{tid}"] = True

                # Inline Edit Form
                if st.session_state.get(f"editing_{tid}", False):
                    with st.expander(f"Editing Transaction #{tid}", expanded=True):
                        with st.form(f"edit_form_{tid}"):
                            e_date = st.date_input("Date", value=pd.to_datetime(row["date"]).date(), key=f"e_date_{tid}")
                            e_type = st.selectbox("Type", TRANSACTION_TYPES, index=0 if row["type"] == "Expense" else 1, key=f"e_type_{tid}")
                            curr_cat_idx = combined_cats.index(row["category"]) if row["category"] in combined_cats else 0
                            e_cat = st.selectbox("Category", combined_cats, index=curr_cat_idx, key=f"e_cat_{tid}")
                            e_amt = st.number_input("Amount (₹)", min_value=0.01, value=float(row["amount"]), key=f"e_amt_{tid}")
                            e_desc = st.text_input("Description", value=row["description"] or "", key=f"e_desc_{tid}")
                            curr_method_idx = PAYMENT_METHODS.index(row["payment_method"]) if row["payment_method"] in PAYMENT_METHODS else 0
                            e_method = st.selectbox("Payment Method", PAYMENT_METHODS, index=curr_method_idx, key=f"e_method_{tid}")

                            e_save, e_cancel = st.columns(2)
                            with e_save:
                                if st.form_submit_button("Save Changes"):
                                    update_transaction(
                                        transaction_id=tid,
                                        user_id=user_id,
                                        date=e_date.strftime("%Y-%m-%d"),
                                        trans_type=e_type,
                                        category=e_cat,
                                        amount=float(e_amt),
                                        description=e_desc,
                                        payment_method=e_method
                                    )
                                    st.session_state[f"editing_{tid}"] = False
                                    st.success("Updated successfully.")
                                    st.rerun()
                            with e_cancel:
                                if st.form_submit_button("Cancel"):
                                    st.session_state[f"editing_{tid}"] = False
                                    st.rerun()

                # Inline Delete Confirmation
                if st.session_state.get(f"confirm_del_{tid}", False):
                    st.warning(f"Are you sure you want to permanently delete this {row['type']} of {format_inr(row['amount'])}?")
                    d_yes, d_no = st.columns([1, 4])
                    with d_yes:
                        if st.button("Yes, Delete", key=f"yes_del_{tid}"):
                            delete_transaction(tid, user_id)
                            st.session_state[f"confirm_del_{tid}"] = False
                            st.success("Transaction deleted.")
                            st.rerun()
                    with d_no:
                        if st.button("Cancel", key=f"no_del_{tid}"):
                            st.session_state[f"confirm_del_{tid}"] = False
                            st.rerun()

                st.markdown("<hr style='margin: 4px 0; border: none; border-top: 1px solid #f1f5f9;'>", unsafe_allow_html=True)
