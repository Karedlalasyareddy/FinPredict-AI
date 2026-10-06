# AI-Based Personal Finance Prediction (FinPredict AI)

A complete, production-grade personal finance management and machine learning expense prediction web application engineered for Indian users. 

Built with **Python 3.11.9**, **Streamlit**, **scikit-learn**, **XGBoost**, and **statsmodels**.

---

## 🌟 Key Features

1. **Strict Multi-User Isolation**: Every user's records (profile, transactions, analytics, and trained ML models) are completely isolated by unique `user_id`. SQLite queries enforce database-level boundaries (`WHERE user_id = ?`).
2. **Indian Currency & Localization**: Complete ₹ INR formatting (`₹1,50,000.00`), standard Indian expense categories, and local payment channels (UPI, Net Banking, Credit Card, Debit Card, Cash).
3. **No Fake Data Policy**: Starts completely empty. Zero mock rows or dummy numbers.
4. **Real AI & Machine Learning Predictor**:
   - Compares **Linear Regression**, **Random Forest Regressor**, and **XGBoost Regressor**.
   - Computes real accuracy metrics: **MAE (Mean Absolute Error)**, **RMSE**, and **R² Fit Score**.
   - Automatically selects the best-fitting algorithm.
   - Forecasts next month's expected expenses, projected savings, spending trend (Increasing / Decreasing / Stable), and major upcoming expense categories.
   - Requires real historical monthly entries before predicting (shows graceful explanation if insufficient).
5. **Interactive Analytics & Insights**: Cash flow trends, savings rate percentages, category breakdowns, and educational financial health tips.
6. **Full CRUD Transactions**: Add, edit, delete, search, and filter by date, type, and category.
7. **Secure Authentication**: Cryptographic password hashing using PBKDF2-HMAC-SHA256 with 100,000 iterations and salt.

---

## 📁 Project Architecture

```
finpredict_ai/
│
├── app.py                  # Main Streamlit application entry point & router
├── requirements.txt        # Exact pinned dependencies
├── .env                    # Environment configuration
├── database.py             # SQLite persistence layer with strict user queries
├── auth.py                 # PBKDF2 password hashing & session management
├── models.py               # Data models, categories, and ₹ INR formatter
├── predictor.py            # scikit-learn, XGBoost & statsmodels ML pipelines
├── analytics.py            # Financial aggregation, trends & insights logic
│
├── views/
│   ├── dashboard.py        # Real-time metrics & financial pulse
│   ├── transactions.py     # Add, edit, delete, search & filter transactions
│   ├── analytics.py        # Visual cash flow trends & charts
│   ├── predictor.py        # Model training, forecast results & benchmarks
│   └── profile.py          # Account info, password update & CSV export
│
├── data/
│   └── finpredict.db       # Persistent SQLite database file
│
└── models_saved/           # Per-user serialized joblib models
```

---

## 💻 Exact Windows Installation & Execution Commands

Follow these step-by-step commands in **Windows Command Prompt (cmd.exe)** or **Windows PowerShell**:

### Step 1: Open Terminal and Navigate to Project Directory
```cmd
cd finpredict_ai
```

### Step 2: Create a Python 3.11 Virtual Environment
```cmd
python -m venv venv
```

### Step 3: Activate the Virtual Environment
**On Windows Command Prompt (cmd):**
```cmd
venv\Scripts\activate.bat
```
*Or on Windows PowerShell:*
```powershell
.\venv\Scripts\Activate.ps1
```
*(If PowerShell restricts scripts, run `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` once)*

### Step 4: Upgrade Pip & Install Dependencies
```cmd
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### Step 5: Run the Streamlit Application
```cmd
streamlit run app.py
```

The application will launch automatically in your browser at:
`http://localhost:8501`

---

## 🐧 Linux / macOS Commands

```bash
cd finpredict_ai
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
streamlit run app.py
```

---

## 🧪 Verification & Multi-User Testing Workflow

1. **User Registration**:
   - Register user `user1@example.com` (Name: "User One").
   - Confirm empty dashboard displays: *"No financial data available yet. Add your income and expenses to start your analysis."*
2. **Add Transactions**:
   - Navigate to **Transactions** > **Add New Transaction**.
   - Add monthly income: `₹80,000` (Salary).
   - Add monthly expenses across multiple dates: `₹18,000` (Rent), `₹6,500` (Food), `₹3,200` (Bills).
3. **Verify Dashboard & Analytics**:
   - Dashboard automatically updates with exact balances and category breakdowns.
4. **Logout & Isolation Test**:
   - Click **Logout**.
   - Register a second user `user2@example.com` (Name: "User Two").
   - Confirm User Two sees a completely blank account with 0 transactions. User One's records are completely hidden.
5. **AI Predictor Test**:
   - When 3+ months of data are logged, open **AI Predictor** and click **Train & Run AI Prediction Model**.
   - View next month's predicted expenditure, model comparison (Linear Regression vs Random Forest vs XGBoost), and validation error metrics.
