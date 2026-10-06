"""
finpredict_ai/auth.py
Secure authentication, cryptographic password hashing, and session management.
"""

import os
import re
import hashlib
import hmac
import secrets
from typing import Optional, Dict, Any, Tuple

try:
    import streamlit as st
except ImportError:
    st = None

from database import get_user_by_email, create_user

SALT_BYTES = 16
HASH_ITERATIONS = 100_000


def hash_password(password: str) -> str:
    """
    Hashes a password securely using PBKDF2-HMAC-SHA256 with a random salt.
    Format: salt_hex$hash_hex
    """
    salt = secrets.token_bytes(SALT_BYTES)
    derived = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, HASH_ITERATIONS)
    return f"{salt.hex()}${derived.hex()}"


def verify_password(stored_password_hash: str, provided_password: str) -> bool:
    """
    Verifies a plain text password against the stored salt$hash using constant-time comparison.
    """
    try:
        parts = stored_password_hash.split("$")
        if len(parts) != 2:
            return False
        salt_hex, hash_hex = parts
        salt = bytes.fromhex(salt_hex)
        expected_hash = bytes.fromhex(hash_hex)
        derived = hashlib.pbkdf2_hmac("sha256", provided_password.encode("utf-8"), salt, HASH_ITERATIONS)
        return hmac.compare_digest(derived, expected_hash)
    except Exception:
        return False


def is_valid_email(email: str) -> bool:
    """Validates email format."""
    if not email or len(email) > 254:
        return False
    pattern = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
    return bool(re.match(pattern, email.strip()))


def validate_registration_inputs(name: str, email: str, password: str, confirm_password: str) -> Tuple[bool, str]:
    """Validates registration fields."""
    if not name or len(name.strip()) < 2:
        return False, "Please enter your full name (at least 2 characters)."
    if not is_valid_email(email):
        return False, "Please enter a valid email address."
    if not password or len(password) < 6:
        return False, "Password must be at least 6 characters long."
    if password != confirm_password:
        return False, "Passwords do not match."
    return True, ""


# ==============================================================================
# STREAMLIT SESSION STATE MANAGEMENT
# ==============================================================================

def init_session_state() -> None:
    """Initializes authentication state in Streamlit session."""
    if st is None:
        return
    if "authenticated" not in st.session_state:
        st.session_state["authenticated"] = False
    if "user" not in st.session_state:
        st.session_state["user"] = None


def login_user(user: Dict[str, Any]) -> None:
    """Sets session state for logged-in user."""
    if st is None:
        return
    # Ensure sensitive password hash is never kept in active UI session
    safe_user = {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "created_at": user.get("created_at", "")
    }
    st.session_state["authenticated"] = True
    st.session_state["user"] = safe_user


def logout_user() -> None:
    """Clears user session state completely."""
    if st is None:
        return
    st.session_state["authenticated"] = False
    st.session_state["user"] = None
    # Clear any user-specific transient keys
    for key in list(st.session_state.keys()):
        if key not in ["authenticated", "user"]:
            del st.session_state[key]


def is_authenticated() -> bool:
    """Checks if a user is currently authenticated."""
    if st is None:
        return False
    return st.session_state.get("authenticated", False) and st.session_state.get("user") is not None


def get_current_user() -> Optional[Dict[str, Any]]:
    """Returns the current authenticated user dictionary or None."""
    if st is None:
        return None
    return st.session_state.get("user", None)
