# Technical Specification
## WindScope — UK Wind Forecast Intelligence

### 1. Architecture Overview
WindScope is built as a clean, decoupled monorepo comprising:
1. **Frontend**: Vite + React 18/19 + TypeScript + Tailwind CSS + Recharts + Lucide Icons.
2. **Backend**: Python 3.10+ FastAPI server running Uvicorn, utilizing HTTPX for asynchronous, non-blocking calls to the Elexon Insights Solution BMRS API.
3. **Containerization**: Multi-stage Dockerfile and Docker Compose configuration for one-command local startup.

```
┌────────────────────────────────────────────────────────┐
│                   React + Vite UI                      │
│   (Dashboard, Recharts, KPI Cards, Filters, Table)     │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP JSON API (/api/*)
┌───────────────────────────▼────────────────────────────┐
│                  FastAPI Backend Server                │
│ ┌───────────────────────┐    ┌───────────────────────┐ │
│ │  Routes & Controllers │    │  Accuracy Calculator  │ │
│ └──────────┬────────────┘    └───────────▲───────────┘ │
│            │                             │             │
│ ┌──────────▼────────────┐    ┌───────────┴───────────┐ │
│ │  Elexon API Client    ├───►│ Forecast Matcher      │ │
│ │  (In-Memory Cache)    │    │ (Cutoff Filter & Sort)│ │
│ └──────────┬────────────┘    └───────────────────────┘ │
└────────────┼───────────────────────────────────────────┘
             │ HTTPS REST
┌────────────▼───────────────────────────────────────────┐
│     Elexon Insights Solution (BMRS) Open API           │
│     - FUELHH/stream (Actual Wind Generation)           │
│     - WINDFOR/stream (Wind Generation Forecasts)       │
└────────────────────────────────────────────────────────┘
```

---

### 2. Technology Stack & Key Libraries

#### Frontend
- **Framework**: React 18+ with TypeScript
- **Bundler**: Vite
- **Styling**: Tailwind CSS (with customized theme variables for Deep Navy `#17324D`, Teal `#0F9D8A`, Slate `#F5F7FA`)
- **Visualizations**: Recharts (`ResponsiveContainer`, `LineChart`, `AreaChart`, `BarChart`, `ReferenceLine`, `Tooltip`)
- **Icons**: Lucide React
- **API Client**: Native `fetch` with TypeScript typings and clean service abstraction

#### Backend
- **Framework**: FastAPI (high-performance asynchronous ASGI API framework)
- **Validation**: Pydantic v2 schemas for request validation and typed response serialisation
- **HTTP Client**: `httpx` (async client with connection pooling, retries, and timeout management)
- **Math/Analytics**: Pure Python data structures and algorithms (or light Pandas where dataset aggregation benefits) for transparent, debuggable calculations
- **Caching**: Thread-safe in-memory TTL cache (default 10-minute cache) to protect against rate limits and redundant upstream calls

---

### 3. API Contracts & Endpoint Specifications

#### 3.1 `GET /api/health`
Checks backend service availability and connectivity to Elexon.
- **Response**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "elexon_reachable": true,
  "timestamp": "2026-10-27T12:00:00Z"
}
```

#### 3.2 `GET /api/comparison`
Returns matched forecast and actual wind generation records for the specified settlement date range and decision cutoff.
- **Query Parameters**:
  - `start_date`: `YYYY-MM-DD` (min `2026-01-01`, max `2026-01-31`, default `2026-01-01`)
  - `end_date`: `YYYY-MM-DD` (min `2026-01-01`, max `2026-01-31`, default `2026-01-31`)
  - `cutoff_hours`: float/int (hours ahead of interval `startTime`, default `1.0` for Gate Closure, or custom e.g. `24.0` for Day-Ahead)
  - `cutoff_preset`: string (`gate_closure`, `day_ahead_12`, `custom`, default `gate_closure`)
- **Response Structure**:
```json
{
  "meta": {
    "start_date": "2026-01-01",
    "end_date": "2026-01-02",
    "cutoff_hours": 1.0,
    "cutoff_preset": "gate_closure",
    "fetched_at": "2026-10-27T12:05:00Z",
    "total_intervals": 96,
    "matched_intervals": 96,
    "missing_actuals": 0,
    "missing_forecasts": 0
  },
  "metrics": {
    "mae_mw": 842.15,
    "rmse_mw": 1104.30,
    "bias_mw": 125.40,
    "mean_actual_mw": 12450.80,
    "mean_forecast_mw": 12576.20,
    "valid_count": 96
  },
  "intervals": [
    {
      "start_time": "2026-01-01T00:00:00Z",
      "settlement_date": "2026-01-01",
      "settlement_period": 1,
      "actual_generation_mw": 14202.0,
      "forecast_generation_mw": 14500.0,
      "forecast_publish_time": "2025-12-31T22:30:00Z",
      "error_mw": 298.0,
      "absolute_error_mw": 298.0,
      "status": "matched"
    }
  ]
}
```

#### 3.3 `GET /api/accuracy/daily`
Returns daily aggregated metrics across January 2026 for trend analysis.

---

### 4. Forecast Matching & Selection Algorithm
1. Retrieve actual wind generation for delivery intervals in range:
   - Filter `FUELHH` records where `fuelType == "WIND"`.
   - Index by delivery `startTime` (ISO 8601 UTC).
2. Retrieve candidate forecasts from `WINDFOR`:
   - Delivery `startTime` between `start_date` 00:00:00Z and `end_date` 23:30:00Z.
   - For each target delivery interval:
     a. Compute `decision_cutoff_time`:
        - If preset == `gate_closure`: `startTime - 1 hour`
        - If preset == `day_ahead_12`: Day prior (D-1) at 12:00:00Z
        - If preset == `custom`: `startTime - cutoff_hours`
     b. Filter forecasts where `forecast.publishTime <= decision_cutoff_time`.
     c. If multiple forecasts qualify, select the one with the maximum `publishTime` (latest information before deadline).
     d. Store selected forecast along with its `publishTime` and compute error:
        $$\text{Error} = \text{Forecast} - \text{Actual}$$
        $$\text{Absolute Error} = |\text{Forecast} - \text{Actual}|$$

---

### 5. Error Handling & Resilience
- **API Connectivity Loss**: Return HTTP 503 with user-friendly diagnostics; do not crash backend.
- **Partial / Missing Records**: Label interval as `missing_forecast` or `missing_actual`, exclude from metric averages, and display warning banners.
- **No Hardcoded Data**: Zero hardcoded arrays of historical results. All calculations derive dynamically from retrieved Elexon payloads.
