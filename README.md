# CareerLens — AI-Powered Career & Burnout Predictor

> **Live Demo:** [career-helper-ml.vercel.app](https://career-helper-ml.vercel.app)

CareerLens is a full-stack machine learning application that predicts three critical student career outcomes — **burnout risk**, **career readiness**, and **likelihood of seeking career counseling** — from a structured set of academic, behavioural, and AI-usage inputs. The system pairs a rigorously built multi-target ML pipeline with a polished React interface and a production FastAPI backend.

---

## Table of Contents

- [Overview](#overview)
- [Live Demo](#live-demo)
- [Features](#features)
- [Architecture](#architecture)
- [Machine Learning Pipeline](#machine-learning-pipeline)
  - [Dataset](#dataset)
  - [Data Preprocessing](#data-preprocessing)
  - [Feature Engineering](#feature-engineering)
  - [Feature Selection](#feature-selection)
  - [Model Training & Hyperparameter Tuning](#model-training--hyperparameter-tuning)
  - [Model Serialisation](#model-serialisation)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [License](#license)

---

## Overview

The project is motivated by a real problem: as AI tools become embedded in academic life, students face compounding pressures — dependency on AI, fear of job displacement, placement anxiety, and burnout. CareerLens quantifies these pressures into actionable predictions that can guide career counseling interventions.

Three separate supervised learning models are trained against the *AI Dependency & Career Anxiety in Students* dataset (15,000 records, 30 features):

| Target | Task | Model |
|---|---|---|
| `burnout_score` | Regression | Linear Regression |
| `overall_career_readiness_score` | Regression | Tuned XGBoost Regressor |
| `seeks_career_counseling` | Binary Classification | Tuned XGBoost Classifier |

Each XGBoost model is optimised independently via **Optuna Bayesian hyperparameter search**, and all three are served through a single FastAPI `/predict` endpoint.

---

## Features

- **Multi-target prediction** — three independent ML models served behind one API call
- **Leakage-free preprocessing** — train/test split happens before any imputation or encoding; all statistics are computed on training data only
- **Bayesian hyperparameter optimisation** — Optuna TPE sampler with MedianPruner across 75–100 trials per model
- **Information Value feature selection** — Weight of Evidence / IV filtering applied to the classification target to surface only discriminative features
- **VIF-based multicollinearity removal** — Variance Inflation Factor analysis eliminates redundant predictors before model training
- **Logic-driven imputation** — categorical missingness in `primary_ai_tools_used` resolved through structural inference from `daily_ai_tool_usage_hrs`, not arbitrary fill
- **ROC / AUC evaluation** — XGBoost classifier evaluated with full ROC curve and AUC reporting
- **Class imbalance handling** — `scale_pos_weight` parameter included in XGBoost classifier search to compensate for class skew
- **React multi-step form** — four-section guided input (Personal → Academic → AI & Career → Lifestyle) with client-side validation
- **Fully responsive** — mobile-optimised layout with touch-friendly slider and radio components

---

## Architecture

```
┌─────────────────────────────────────┐
│         React Frontend (Vite)       │
│  Multi-step form → POST /predict    │
│  Deployed: Vercel                   │
└────────────────┬────────────────────┘
                 │ HTTPS (CORS-restricted)
┌────────────────▼────────────────────┐
│         FastAPI Backend             │
│  /predict  →  prediction_helper.py  │
│  /model_status                      │
│  Deployed: Render                   │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│     artifacts/models.pkl (joblib)   │
│  ├── MinMaxScaler                   │
│  ├── Burnout Regressor              │
│  ├── Career Readiness Regressor     │
│  └── Counseling Classifier          │
└─────────────────────────────────────┘
```

The frontend is a Vite + React deployed on Vercel. The backend is a FastAPI service that loads a single serialised joblib artifact containing the scaler and all three models.

---

## Machine Learning Pipeline

The full pipeline is documented in [`backend/Career_Predictor_Documented.ipynb`](backend/Career_Predictor_Documented.ipynb).

### Dataset

- **Source:** *AI Dependency & Career Anxiety in Students*
- **Size:** 15,000 records × 30 features
- **Split:** 70% train (10,500 rows) / 30% test (4,500 rows)

The split is performed **before** any EDA, imputation, or transformation. This is a deliberate architectural decision to prevent data leakage — no test-set information contaminates the statistics derived during preprocessing.

### Data Preprocessing

**Categorical imputation — `primary_ai_tools_used`:**
Missingness in this column is structurally non-random. Rather than collapsing all missing values into a single category, a two-branch rule is applied:
- `daily_ai_tool_usage_hrs == 0` → fill with `'None'` (student does not use AI tools)
- `daily_ai_tool_usage_hrs > 0` → fill with `'Unknown'` (student uses AI but the tool is unrecorded)

**Numeric imputation:**
Distribution shapes of `sleep_hours`, `social_media_hrs_per_day`, and `self_learning_hours_per_week` were inspected via KDE plots before selecting a strategy. All three exhibited skew, so **median imputation** was applied (medians computed on training data only, then applied to test). `seeks_career_counseling` was imputed with the training-set mode.

### Feature Engineering

| Column | Encoding | Rationale |
|---|---|---|
| `college_tier` | Ordinal (Tier 3→0, Tier 2→1, Tier 1→2) | Natural rank ordering |
| `uses_ai_for_assignments` | Ordinal (Never→0 … Always→4) | Ordered frequency scale |
| `urban_or_rural` | Binary (Rural→0, Urban→1) | Binary nominal |
| `gender`, `degree_type`, `stream`, `primary_ai_tools_used` | One-hot (`drop_first=True`) | Nominal, no ordering |

`df_train2.align(df_test2, join='left')` ensures test-set dummy columns missing from training are added and zero-filled, preventing shape mismatch during inference.

Feature scaling is performed with `MinMaxScaler` fitted exclusively on the training set.

### Feature Selection

**Multicollinearity check (VIF):** Variance Inflation Factor analysis is run on the encoded feature matrix. Features with VIF above the threshold are iteratively removed to reduce redundancy and improve model stability.

**Weight of Evidence / Information Value (WoE/IV):** IV-based selection is applied specifically to the classification target (`seeks_career_counseling`). Only features with IV above the minimum threshold are retained in `X_train2` / `X_test2`, the feature matrix used for classifier training. Regression targets use the full feature set (`X_train1`).

### Model Training & Hyperparameter Tuning

Each target is trained with a baseline sweep (Linear/Logistic Regression, Random Forest, XGBoost) followed by Optuna-driven hyperparameter search on the best-performing model family.

**Optuna configuration (all studies):**
- Sampler: `TPESampler(seed=42)` — Tree-structured Parzen Estimator Bayesian search
- Pruner: `MedianPruner` — terminates unpromising trials early
- CV: 3-fold (regression, R² metric) / 5-fold (classification, macro F1 metric)

**Burnout Score (Regression):**
Out of all models LinearRegression showed the best R² score and tells that burnout has a complete linear relationship to other columns and hence LinrearRegression was chosen.

**Career Readiness Score (Regression):**
Search covers ElasticNet (L1 + L2 penalty mix via `saga` solver, alpha, l1_ratio) and XGBRegressor (n_estimators, learning_rate, max_depth, min_child_weight, gamma, subsample, colsample_bytree/bylevel/bynode, reg_alpha, reg_lambda, max_delta_step, grow_policy). Metric: R².

**Career Counseling Classifier (Binary Classification):**
- **Logistic Regression search:** L1/L2/ElasticNet penalties via `saga` solver, C, class_weight (None / balanced). 75 trials. Metric: macro F1.
- **XGBoost search:** Same tree search space, plus `scale_pos_weight` searched in range `[1, neg/pos × 2]` to handle class imbalance. 100 trials. Metric: macro F1.
- **ROC/AUC:** Final classifier evaluated with `predict_proba` soft scores plotted as a full ROC curve.

### Model Serialisation

All inference components are bundled into a single `artifacts/models.pkl` via `joblib`:

```python
{
    'scaler': {'scaler': <MinMaxScaler>, 'cols': [...]},
    'model_burnout_score': {'model': <best_regressor>, 'cols': [...]},
    'model_seeks_career_counseling': {'model': <XGBClassifier>, 'cols': [...]},
    'model_overall_career_readiness_score': {'model': <XGBRegressor>, 'cols': [...]}
}
```

Column lists are stored alongside each model so that `prediction_helper.py` can correctly reorder and subset incoming feature DataFrames before prediction, preventing silent shape mismatches at inference time.

---

## Tech Stack

**ML / Data Science**
- Python 3.10
- pandas, NumPy
- scikit-learn (preprocessing, linear models, ensemble models, metrics)
- XGBoost
- Optuna (Bayesian hyperparameter optimisation)
- statsmodels (VIF)
- seaborn, matplotlib (EDA visualisation)
- joblib (model serialisation)

**Backend**
- FastAPI 0.136
- Pydantic v2 (request/response validation)
- Uvicorn (ASGI server)

**Frontend**
- React 18 (hooks only — no class components)
- Vite
- Vanilla CSS-in-JS (zero external UI library dependency)

**Infrastructure**
- Frontend: Vercel
- Backend: Render / Railway (Python 3.10.13 runtime)

---

## Project Structure

```
soham-lodh-career-helper/
├── backend/
│   ├── Career_Predictor_Documented.ipynb   # Full ML pipeline with inline documentation
│   ├── main.py                             # FastAPI app, routes, Pydantic schemas
│   ├── prediction_helper.py                # Inference logic: encoding, scaling, predict
│   ├── requirements.txt                    # Pinned Python dependencies
│   ├── runtime.txt                         # Python version for deployment
│   └── artifacts/
│       └── models.pkl                      # Serialised scaler + 3 models (joblib)
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── eslint.config.js
│   └── src/
│       ├── main.jsx                        # React entry point
│       ├── App.jsx                         # Full application: form, steps, results
│       └── index.css
├── LICENSE                                 # MIT
└── README.md
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/soham-lodh/career-helper.git
cd career-helper/backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the development server
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

> **Note:** `artifacts/models.pkl` must be present before starting the server. Either use the pre-trained artifact from the repository or re-run `Career_Predictor_Documented.ipynb` to regenerate it.

### Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:5173`.

### Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_BASE_URL=http://localhost:8000
```

For production, set `VITE_API_BASE_URL` to your deployed backend URL in your Vercel project environment variables.

---

## API Reference

### `GET /model_status`

Returns the current load status of the ML models.

**Response**
```json
{
  "model": "career_readiness",
  "status": "loaded"
}
```

---

### `POST /predict`

Accepts a student profile and returns three ML predictions.

**Request Body**

| Field | Type | Constraints | Description |
|---|---|---|---|
| `age` | int | 16–40 | Student age |
| `gender` | str | — | `Male`, `Female`, `Non-binary` |
| `degree_type` | str | — | `B.Tech/B.E.`, `M.Tech/M.Sc`, `MBA`, `BCA/MCA` |
| `stream` | str | — | `CS/IT`, `Engineering (Non-CS)`, `Commerce/Management` |
| `year_of_study` | int | 1–6 | Current year of degree |
| `college_tier` | str | — | `Tier 1`, `Tier 2`, `Tier 3` |
| `urban_or_rural` | str | — | `Urban`, `Rural` |
| `daily_ai_tool_usage_hrs` | float | 0–24 | Hours per day using AI tools |
| `primary_ai_tools_used` | str | — | `ChatGPT`, `Gemini`, `Claude`, `Perplexity`, `GitHub Copilot`, `None` |
| `ai_replaces_own_thinking_score` | int | 1–10 | Self-rated AI reliance for cognitive tasks |
| `ai_dependency_score` | int | 1–10 | Overall AI dependency self-assessment |
| `fear_of_job_loss_to_ai` | int | 1–10 | Perceived threat from AI to career |
| `career_clarity_score` | int | 1–10 | Clarity about career direction |
| `internship_experience` | int | ≥ 0 | Number of internships completed |
| `weekly_job_application_count` | int | ≥ 0 | Job applications per week |
| `resume_confidence_score` | int | 1–10 | Confidence in resume quality |
| `interview_anxiety_score` | int | 1–10 | Anxiety level during interviews |
| `daily_study_hours` | float | 0–24 | Hours per day studying |
| `self_learning_hours_per_week` | float | ≥ 0 | Self-directed learning hours per week |
| `skill_development_courses_taken` | int | ≥ 0 | Online courses completed |
| `social_media_hrs_per_day` | float | 0–24 | Daily social media usage |
| `sleep_hours` | float | 0–24 | Average nightly sleep |
| `stress_level` | int | 1–10 | Self-rated stress |
| `motivation_score` | int | 1–10 | Self-rated motivation |

**Response**
```json
{
  "burnout_score": 6.24,
  "career_counseling_score": 1.0,
  "career_readiness_score": 7.83
}
```

| Field | Range | Interpretation |
|---|---|---|
| `burnout_score` | 1–10 | Predicted burnout level (higher = more burned out) |
| `career_counseling_score` | 0 or 1 | Binary: 1 = likely to seek career counseling |
| `career_readiness_score` | continuous | Predicted overall career readiness (higher = more ready) |

---

## License

MIT © 2026 Soham Lodh. See [LICENSE](LICENSE) for details.
