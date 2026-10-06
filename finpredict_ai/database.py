"""
finpredict_ai/database.py
Persistent SQLite database layer with strict user-level data isolation.
"""

import os
import sqlite3
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime

# Resolve database directory and file path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)
DEFAULT_DB_PATH = os.path.join(DATA_DIR, "finpredict.db")


def get_db_connection(db_path: Optional[str] = None) -> sqlite3.Connection:
    """Creates a database connection with row factory and foreign key enforcement."""
    target_path = db_path or os.environ.get("DB_PATH", DEFAULT_DB_PATH)
    if not os.path.isabs(target_path):
        target_path = os.path.join(BASE_DIR, target_path)
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    
    conn = sqlite3.connect(target_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def init_db(db_path: Optional[str] = None) -> None:
    """Initializes tables if they do not exist."""
    conn = get_db_connection(db_path)
    cursor = conn.cursor()

    # Users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL COLLATE NOCASE,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Transactions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        type TEXT NOT NULL,
        category TEXT NOT NULL,
        amount REAL NOT NULL CHECK(amount > 0),
        description TEXT,
        payment_method TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    # Predictions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS predictions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        prediction_date TEXT NOT NULL,
        predicted_expense REAL NOT NULL,
        predicted_savings REAL NOT NULL,
        model_name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    # Indices for performance and isolation
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_trans_user ON transactions(user_id, date);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_pred_user ON predictions(user_id, created_at);")

    conn.commit()
    conn.close()


# Ensure DB is initialized on module import
init_db()


# ==============================================================================
# USER OPERATIONS
# ==============================================================================

def create_user(name: str, email: str, password_hash: str) -> Optional[int]:
    """Registers a new user and returns their user ID."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
            (name.strip(), email.strip().lower(), password_hash)
        )
        conn.commit()
        return cursor.lastrowid
    except sqlite3.IntegrityError:
        return None
    finally:
        conn.close()


def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Retrieves user record by email."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ? COLLATE NOCASE", (email.strip().lower(),))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
    """Retrieves user record by user ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, email, created_at FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def update_user_name(user_id: int, new_name: str) -> bool:
    """Updates the user's name."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET name = ? WHERE id = ?", (new_name.strip(), user_id))
    rows_affected = cursor.rowcount
    conn.commit()
    conn.close()
    return rows_affected > 0


def update_user_password(user_id: int, new_password_hash: str) -> bool:
    """Updates user password hash."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET password_hash = ? WHERE id = ?", (new_password_hash, user_id))
    rows_affected = cursor.rowcount
    conn.commit()
    conn.close()
    return rows_affected > 0


# ==============================================================================
# TRANSACTION OPERATIONS (STRICT USER ISOLATION)
# ==============================================================================

def add_transaction(
    user_id: int,
    date: str,
    trans_type: str,
    category: str,
    amount: float,
    description: Optional[str] = "",
    payment_method: Optional[str] = ""
) -> int:
    """Inserts a transaction strictly assigned to user_id."""
    if amount <= 0:
        raise ValueError("Amount must be greater than zero.")
    if trans_type not in ["Income", "Expense"]:
        raise ValueError("Transaction type must be 'Income' or 'Expense'.")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO transactions (user_id, date, type, category, amount, description, payment_method)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        user_id,
        date,
        trans_type,
        category.strip(),
        float(amount),
        description.strip() if description else "",
        payment_method.strip() if payment_method else ""
    ))
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return new_id


def get_transactions(
    user_id: int,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    trans_type: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Fetches transactions belonging ONLY to user_id, with optional filters.
    Database-enforced isolation.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM transactions WHERE user_id = ?"
    params: List[Any] = [user_id]

    if start_date:
        query += " AND date >= ?"
        params.append(start_date)
    if end_date:
        query += " AND date <= ?"
        params.append(end_date)
    if trans_type and trans_type != "All":
        query += " AND type = ?"
        params.append(trans_type)
    if category and category != "All":
        query += " AND category = ?"
        params.append(category)
    if search and search.strip():
        query += " AND (description LIKE ? OR category LIKE ? OR payment_method LIKE ?)"
        s = f"%{search.strip()}%"
        params.extend([s, s, s])

    query += " ORDER BY date DESC, id DESC"

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_transaction_by_id(transaction_id: int, user_id: int) -> Optional[Dict[str, Any]]:
    """Retrieves a single transaction verifying user ownership."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM transactions WHERE id = ? AND user_id = ?", (transaction_id, user_id))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def update_transaction(
    transaction_id: int,
    user_id: int,
    date: str,
    trans_type: str,
    category: str,
    amount: float,
    description: Optional[str] = "",
    payment_method: Optional[str] = ""
) -> bool:
    """Updates a transaction only if owned by user_id."""
    if amount <= 0:
        raise ValueError("Amount must be greater than zero.")
    if trans_type not in ["Income", "Expense"]:
        raise ValueError("Transaction type must be 'Income' or 'Expense'.")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE transactions
        SET date = ?, type = ?, category = ?, amount = ?, description = ?, payment_method = ?
        WHERE id = ? AND user_id = ?
    """, (
        date,
        trans_type,
        category.strip(),
        float(amount),
        description.strip() if description else "",
        payment_method.strip() if payment_method else "",
        transaction_id,
        user_id
    ))
    rows_affected = cursor.rowcount
    conn.commit()
    conn.close()
    return rows_affected > 0


def delete_transaction(transaction_id: int, user_id: int) -> bool:
    """Deletes a transaction strictly verifying user ownership."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM transactions WHERE id = ? AND user_id = ?", (transaction_id, user_id))
    rows_affected = cursor.rowcount
    conn.commit()
    conn.close()
    return rows_affected > 0


def get_user_categories(user_id: int) -> List[str]:
    """Returns distinct categories created/used by this user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT category FROM transactions WHERE user_id = ? ORDER BY category", (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [r["category"] for r in rows if r["category"]]


# ==============================================================================
# PREDICTIONS & SUMMARY OPERATIONS
# ==============================================================================

def save_prediction(
    user_id: int,
    prediction_date: str,
    predicted_expense: float,
    predicted_savings: float,
    model_name: str
) -> int:
    """Saves an AI model prediction record for user_id."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO predictions (user_id, prediction_date, predicted_expense, predicted_savings, model_name)
        VALUES (?, ?, ?, ?, ?)
    """, (user_id, prediction_date, float(predicted_expense), float(predicted_savings), model_name))
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return new_id


def get_latest_prediction(user_id: int) -> Optional[Dict[str, Any]]:
    """Gets the most recent prediction made for this user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM predictions
        WHERE user_id = ?
        ORDER BY created_at DESC, id DESC
        LIMIT 1
    """, (user_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def get_user_stats(user_id: int) -> Dict[str, Any]:
    """Computes overall statistics for a user directly in SQL."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            COUNT(*) as total_transactions,
            COALESCE(SUM(CASE WHEN type = 'Income' THEN amount ELSE 0 END), 0) as total_income,
            COALESCE(SUM(CASE WHEN type = 'Expense' THEN amount ELSE 0 END), 0) as total_expenses
        FROM transactions
        WHERE user_id = ?
    """, (user_id,))
    row = cursor.fetchone()
    conn.close()

    total_income = float(row["total_income"]) if row else 0.0
    total_expenses = float(row["total_expenses"]) if row else 0.0
    total_transactions = int(row["total_transactions"]) if row else 0
    balance = total_income - total_expenses
    savings_pct = (balance / total_income * 100) if total_income > 0 else 0.0

    return {
        "total_transactions": total_transactions,
        "total_income": total_income,
        "total_expenses": total_expenses,
        "balance": balance,
        "savings_rate": savings_pct
    }
