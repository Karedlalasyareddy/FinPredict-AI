"""
finpredict_ai/models.py
Domain models, constants, and formatting utilities for FinPredict AI.
"""

from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime

# Standard expense and income categories
DEFAULT_EXPENSE_CATEGORIES = [
    "Food",
    "Travel",
    "Shopping",
    "Education",
    "Bills",
    "Rent",
    "Healthcare",
    "Entertainment",
    "Subscriptions",
    "Other"
]

DEFAULT_INCOME_CATEGORIES = [
    "Salary",
    "Freelance",
    "Business",
    "Investments",
    "Other"
]

ALL_SUGGESTED_CATEGORIES = sorted(list(set(DEFAULT_EXPENSE_CATEGORIES + DEFAULT_INCOME_CATEGORIES)))

PAYMENT_METHODS = [
    "UPI",
    "Net Banking",
    "Credit Card",
    "Debit Card",
    "Cash",
    "Other"
]

TRANSACTION_TYPES = ["Expense", "Income"]


@dataclass
class User:
    id: int
    name: str
    email: str
    password_hash: str
    created_at: str


@dataclass
class Transaction:
    id: int
    user_id: int
    date: str
    type: str  # 'Income' or 'Expense'
    category: str
    amount: float
    description: Optional[str] = None
    payment_method: Optional[str] = None
    created_at: Optional[str] = None


@dataclass
class PredictionRecord:
    id: int
    user_id: int
    prediction_date: str
    predicted_expense: float
    predicted_savings: float
    model_name: str
    created_at: Optional[str] = None


def format_inr(amount: float, include_symbol: bool = True) -> str:
    """
    Format number according to Indian Currency System:
    e.g., 150000 -> ₹1,50,000.00 or 10000000 -> ₹1,00,00,000.00
    """
    if amount is None:
        amount = 0.0

    is_negative = amount < 0
    amount = abs(amount)
    
    # Split integer and decimal parts
    parts = f"{amount:.2f}".split(".")
    integer_part = parts[0]
    decimal_part = parts[1]

    # Indian numbering format: last 3 digits, then groups of 2 digits
    if len(integer_part) > 3:
        last_three = integer_part[-3:]
        remaining = integer_part[:-3]
        groups = []
        while len(remaining) > 2:
            groups.insert(0, remaining[-2:])
            remaining = remaining[:-2]
        if remaining:
            groups.insert(0, remaining)
        formatted_int = ",".join(groups) + "," + last_three
    else:
        formatted_int = integer_part

    prefix = "₹" if include_symbol else ""
    sign = "-" if is_negative else ""
    return f"{sign}{prefix}{formatted_int}.{decimal_part}"
