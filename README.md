# WindScope — UK Wind Forecast Intelligence

> A decision-grounded energy analytics dashboard evaluating Elexon wind generation forecast accuracy across January 2026 for a UK wholesale electricity purchasing team.

[![Backend Tests](https://img.shields.io/badge/pytest-17%20passed-brightgreen.svg)]()
[![Frontend Tests](https://img.shields.io/badge/vitest-4%20passed-brightgreen.svg)]()
[![TypeScript](https://img.shields.io/badge/typescript-strict-blue.svg)]()
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)]()
[![Docker](https://img.shields.io/badge/docker-compose%20ready-2496ED.svg)]()

---

## 1. Project Overview
**WindScope** is a full-stack web application designed for a UK electricity utility's wholesale power purchasing and trading team. It reconstructs and evaluates the accuracy of National Grid ESO / Elexon wind generation forecasts published throughout **January 1–31, 2026**, strictly evaluating what information was available at the relevant purchasing decision deadline.

The platform provides operational decision support to help energy buyers understand forecast uncertainty, systematic over/under-hedging bias, and error distributions when bidding in Day-Ahead power auctions or managing balancing positions prior to Gate Closure.

---

## 2. Business Problem
UK electricity demand must be continuously balanced against physical generation in 30-minute settlement periods (48 periods per day). Because wind power is intermittent, wholesale purchasing desks rely on forecast curves to hedge customer volume:
- **Overforecasting (+Error)**: Forecasts predict more wind than physically delivered. Utilities risk under-hedging in forward markets, exposing them to costly real-time system buy cash-out prices.
- **Underforecasting (−Error)**: Forecasts underestimate delivered wind. Utilities risk over-hedging, forcing excess volume into lower system sell cash-out prices.

### Central Question
> *How accurately did Elexon's wind generation forecasts predict actual UK wind generation during January 2026, considering only the forecasts available at the relevant purchasing decision cutoff?*

---

## 3. Proposed Solution
WindScope provides:
1. **Decision Cutoff Enforcement**: Reconstructs forecast availability at market decision points (Gate Closure 1 hour ahead, Day-Ahead D-1 12:00 UTC, 2h, 4h, 12h, 24h ahead), selecting only the latest eligible forecast published *before* the cutoff.
2. **Empirical Performance KPIs**: Computes Mean Absolute Error (MAE), Root Mean Squared Error (RMSE), and Forecast Bias across valid matched settlement intervals.
3. **Interactive Time-Series Analytics**: Responsive dual-curve visualisations comparing actual generation against eligible forecasts, plus a signed error delta chart with zero reference line.
4. **Interval-Level Auditability**: An interactive table detailing all 48 settlement periods per day with sorting, pagination, publication timestamps, and CSV export.
5. **Daily Summaries**: Aggregate trend analysis across all 31 days of January 2026.

---

## 4. Main Features
- **Strict January 2026 Scope**: Evaluates 1,488 expected half-hour delivery intervals (31 days × 48 periods).
- **Configurable Decision Cutoff**:
  - *Gate Closure (Default)*: 1 hour prior to interval delivery start time.
  - *Day-Ahead Auction*: 12:00 UTC on the calendar day prior (D-1).
  - *Custom Lead Times*: 2h, 4h, 12h, 24h ahead.
- **KPI Cards with Tooltips**:
  - **MAE (MW)**: Average error magnitude.
  - **RMSE (MW)**: Error variance, heavily penalizing extreme spikes.
  - **Bias (Signed MW)**: Overforecasting vs underforecasting directionality.
  - **Match Coverage**: Percentage and counts of intervals successfully matched.
- **Visual Analytics**:
  - *Forecast vs. Actual Area Chart*: Distinct blue (actual) and teal (forecast) curves with rich hover tooltips.
  - *Forecast Error Bar Chart*: Color-coded divergences (Amber for Overforecast, Crimson for Underforecast) with zero reference line.
- **Historical Interval Table**: Sortable columns, page size controls (24, 48, 96 rows), publication timestamps, lead times, and CSV download.
- **Data Quality Banner**: Real-time indicators of Elexon data source health, sync timestamp, and gap tracking.
- **Daily Summary Modal**: Complete tabular breakdown of daily MAE, RMSE, and bias across the entire month.

---

## 5. Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS (Deep Navy `#17324D`, Teal `#0F9D8A`, Slate `#F8FAFC`)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Testing**: Vitest

### Backend
- **Framework**: Python 3.12 + FastAPI
- **Data Validation**: Pydantic v2
- **HTTP Client**: HTTPX (Async connection pooling and timeout handling)
- **Caching**: Thread-safe in-memory TTL cache (10 minutes)
- **Testing**: Pytest & pytest-asyncio

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Reverse Proxy**: Nginx (serving static frontend and proxying `/api/` in production)

---

## 6. Screenshots & Visual Interface
The dashboard features an understated, professional energy analytics interface inspired by utility trading desks:
- **Header**: Navigation, UK Grid BMRS badge, live status indicator, and Daily Summary trigger.
- **Filter Bar**: Date range pickers (strictly bounded to Jan 2026), quick week/storm presets, and decision cutoff dropdown.
- **KPI Grid**: 4 responsive summary cards with plain-language tooltips and directional badges.
- **Dual Time-Series**: Dual-curve actual vs forecast overlay with custom tooltips showing publish timestamps and error deltas.
- **Error Delta Chart**: Diverging error bars around a zero benchmark line.
- **Historical Table**: Comprehensive settlement interval audit table with CSV download.

---

## 7. Folder Structure
```text
windscope/
├── docs/
│   ├── PRD.md                  # Product requirements and target personas
│   ├── TECHNICAL_SPEC.md       # Architecture, API contracts, and technology choices
│   ├── DATA_SPEC.md            # Datasets, field mappings, market clock rules
│   ├── UI_UX_SPEC.md           # Tokens, layout breakpoints, and accessibility
│   └── ACCEPTANCE_CRITERIA.md  # Testable requirements
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/                # API client layer (fetchComparison, fetchDailySummary)
│   │   ├── components/
│   │   │   ├── charts/         # ForecastActualChart, ForecastErrorChart, HistoricalTable
│   │   │   ├── common/         # Badge, TooltipInfo, LoadingSpinner
│   │   │   ├── dashboard/      # KpiCard, KpiGrid, DataQualityBanner, DailySummaryModal
│   │   │   └── filters/        # DateRangeFilter, DecisionCutoffSelector
│   │   ├── layouts/            # AppHeader, AppFooter
│   │   ├── styles/             # Tailwind CSS tokens and base styles
│   │   ├── types/              # TypeScript interfaces for API models
│   │   ├── utils/              # formatters, exportCsv
│   │   ├── App.tsx             # Main dashboard view
│   │   └── main.tsx            # DOM root entry
│   ├── nginx.conf              # Nginx production configuration
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── backend/
│   ├── app/
│   │   ├── api/                # FastAPI routes (/api/health, /api/comparison, etc.)
│   │   ├── clients/            # Async Elexon BMRS client with caching
│   │   ├── core/               # Configuration settings (pydantic-settings)
│   │   ├── schemas/            # Pydantic models and response schemas
│   │   ├── services/           # Forecast selection, matching, and accuracy calculations
│   │   ├── utils/              # Market time, UTC/GMT helpers, settlement periods
│   │   └── main.py             # FastAPI application entrypoint
│   ├── tests/                  # Pytest test suite (17 unit and integration tests)
│   ├── requirements.txt
│   └── Dockerfile
├── .env.example
├── .gitignore
├── docker-compose.yml
└── README.md
```

---

## 8. Data Sources and API Documentation
WindScope communicates directly with the official open **Elexon Insights Solution (BMRS) API**:

1. **Actual Wind Generation (`FUELHH`)**:
   - Endpoint: `https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream`
   - Filter: `fuelType = "WIND"`
   - Fields: `startTime`, `settlementDate`, `settlementPeriod`, `generation` (MW).
2. **Wind Generation Forecasts (`WINDFOR`)**:
   - Endpoint: `https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR/stream`
   - Fields: `startTime`, `publishTime`, `generation` (MW).

---

## 9. Forecast Selection Methodology
To ensure decision-time fidelity:
1. For each target delivery interval starting at $T_{\text{start}}$, compute the decision cutoff $T_{\text{cutoff}}$:
   - **Gate Closure**: $T_{\text{start}} - 1\text{ hour}$
   - **Day-Ahead 12:00**: $(T_{\text{start}} - 1\text{ day}) \text{ at 12:00:00 UTC}$
   - **Custom $X$ Hours**: $T_{\text{start}} - X\text{ hours}$
2. Identify all candidate forecasts in `WINDFOR` where:
   $$\text{forecast.startTime} == T_{\text{start}} \quad \text{and} \quad \text{forecast.publishTime} \le T_{\text{cutoff}}$$
   *(Note: Elexon publishes WINDFOR forecasts on an hourly basis; if no exact `:30` record exists, the forecast for the parent hour applies to both constituent settlement periods).*
3. From all eligible candidate forecasts, select the one with the latest `publishTime` (most recent information available before cutoff).
4. Calculate error:
   $$\text{Error} = \text{Forecast} - \text{Actual}$$

---

## 10. Accuracy Metric Definitions
Given $N$ valid matched settlement intervals:
- **Mean Absolute Error (MAE)**:
  $$\text{MAE} = \frac{1}{N} \sum_{i=1}^N |\text{Forecast}_i - \text{Actual}_i| \quad [\text{MW}]$$
- **Root Mean Squared Error (RMSE)**:
  $$\text{RMSE} = \sqrt{\frac{1}{N} \sum_{i=1}^N (\text{Forecast}_i - \text{Actual}_i)^2} \quad [\text{MW}]$$
- **Forecast Bias (Mean Error)**:
  $$\text{Bias} = \frac{1}{N} \sum_{i=1}^N (\text{Forecast}_i - \text{Actual}_i) \quad [\text{MW}]$$
  - Positive ($>0$): Systematic overforecasting.
  - Negative ($<0$): Systematic underforecasting.

---

## 11. Data Limitations & Assumptions
1. **Commercial Trade Boundaries**: The application does not ingest confidential internal utility trades, purchase quantities, contract prices, or client portfolio balance positions.
2. **Market Clock**: All market timestamps are processed and stored in UTC (Greenwich Mean Time). British Summer Time (BST) does not apply to January.
3. **No Synthetic Fill**: Missing records are flagged as `missing_forecast` or `missing_actual` and excluded from averages; values are never silently replaced with 0.

---

## 12. Local Setup Instructions

### Prerequisites
- Python 3.10+ (Python 3.12 recommended)
- Node.js 18+ (Node.js 20+ recommended) and npm
- Docker & Docker Compose (optional for containerized run)

### Backend Setup
```bash
# Navigate to backend and create virtual environment
cd backend
python -m venv .venv

# Activate virtual environment (Windows PowerShell)
.\.venv\Scripts\Activate.ps1
# (On macOS/Linux: source .venv/bin/activate)

# Install requirements
pip install -r requirements.txt

# Run backend development server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Backend API docs will be available at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

### Frontend Setup
```bash
# In a new terminal, navigate to frontend
cd frontend

# Install npm dependencies
npm install

# Start Vite development server
npm run dev
```
The frontend will open at [http://localhost:5173](http://localhost:5173).

---

## 13. Environment Variables
Copy `.env.example` to `.env`:
```ini
APP_NAME=WindScope — UK Wind Forecast Intelligence
APP_VERSION=1.0.0
DEBUG=False
ELEXON_BASE_URL=https://data.elexon.co.uk/bmrs/api/v1
DEFAULT_START_DATE=2026-01-01
DEFAULT_END_DATE=2026-01-31
DEFAULT_CUTOFF_PRESET=gate_closure
DEFAULT_CUTOFF_HOURS=1.0
CACHE_TTL_SECONDS=600
```

---

## 14. Docker Instructions
To start the entire application (FastAPI backend + Nginx-served React frontend) with a single command:

```bash
docker compose up --build
```
- Frontend application: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:8000](http://localhost:8000)

To stop the containers:
```bash
docker compose down
```

---

## 15. Test Commands

### Run Backend Tests (Pytest)
```bash
# From workspace root with backend/.venv activated:
$env:PYTHONPATH = "d:\REint\backend"
pytest backend/tests -v
```
*(All 17 tests verify accuracy metrics, forecast selection cutoff enforcement, Day-Ahead rules, interval generation, and API error handling).*

### Run Frontend Tests (Vitest)
```bash
cd frontend
npm test
```

### Type-Check Frontend
```bash
cd frontend
npm run build
```

---

## 16. Deployment Instructions
- **Frontend**: Can be built via `npm run build` and hosted on any static hosting service (Vercel, Netlify, Cloudflare Pages, AWS S3 + CloudFront). Configure `VITE_API_BASE_URL` to point to the backend domain.
- **Backend**: Can be deployed on any container-capable platform (Render, Fly.io, AWS ECS, Google Cloud Run). Ensure `CORS_ORIGINS` includes the frontend production domain.

---

## 17. Known Limitations
- Elexon BMRS `WINDFOR` publishes forecasts on an hourly cadence. The application maps each hourly forecast to both 30-minute settlement periods in that hour.
- Out-of-month queries: Per prompt specifications, date ranges are strictly validated and limited to January 1–31, 2026.

---

## 18. AI Tools Used During Development
- **Antigravity Coding Assistant (Gemini 3.8 Flash)**: Used for architecture design, specification drafting (`docs/*`), test-driven implementation, mathematical verification of error metrics, and Docker containerization. All outputs were verified against live Elexon BMRS endpoints and local automated test suites.
