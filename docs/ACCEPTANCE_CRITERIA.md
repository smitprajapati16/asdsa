# Acceptance Criteria
## WindScope — UK Wind Forecast Intelligence

### 1. Data Integrity & API Ingestion
- [ ] **AC-1.1**: The application fetches live actual wind generation records from Elexon BMRS `FUELHH/stream` filtered by `fuelType == "WIND"`.
- [ ] **AC-1.2**: The application fetches forecast generation records from Elexon BMRS `WINDFOR/stream`.
- [ ] **AC-1.3**: All dates outside January 1, 2026 to January 31, 2026 are rejected by API validation with clear HTTP 422/400 messages.
- [ ] **AC-1.4**: No synthetic or mock data is silently substituted in production mode; real API data is ingested and cached transparently.

### 2. Decision Cutoff & Forecast Selection
- [ ] **AC-2.1**: For each delivery interval, only forecasts published at or before the configured decision cutoff are eligible for matching.
- [ ] **AC-2.2**: If multiple eligible forecasts exist for a delivery interval, the one with the latest `publishTime` (most recent information) is selected.
- [ ] **AC-2.3**: If no eligible forecast was published prior to the cutoff, the interval is flagged as `missing_forecast` and excluded from accuracy calculations.
- [ ] **AC-2.4**: The default decision cutoff is Gate Closure (1 hour prior to interval start).
- [ ] **AC-2.5**: The UI allows switching to presets (2h ahead, 4h ahead, 12h ahead, 24h ahead, Day-Ahead 12:00 D-1) and recalculates metrics and charts accordingly.

### 3. Metric Calculations
- [ ] **AC-3.1**: **MAE** is calculated as $\frac{1}{N} \sum |f_i - a_i|$ and displayed in MW with 2 decimal precision.
- [ ] **AC-3.2**: **RMSE** is calculated as $\sqrt{\frac{1}{N} \sum (f_i - a_i)^2}$ and displayed in MW with 2 decimal precision.
- [ ] **AC-3.3**: **Forecast Bias** is calculated as $\frac{1}{N} \sum (f_i - a_i)$ and correctly indicates whether the forecast on average over-predicted or under-predicted generation.
- [ ] **AC-3.4**: All metrics display the number of valid matched intervals $N$ used in the calculation.

### 4. User Interface & Visualizations
- [ ] **AC-4.1**: KPI cards display MAE, RMSE, Bias, and Interval Count cleanly with tooltips explaining each metric.
- [ ] **AC-4.2**: The Forecast vs. Actual chart renders time on the X-axis and MW on the Y-axis, displaying both curves with distinct styling.
- [ ] **AC-4.3**: Tooltips on the chart display interval date/time, settlement period, actual MW, forecast MW, delta MW, and forecast publication time.
- [ ] **AC-4.4**: The Forecast Error chart displays the delta $(f_i - a_i)$ over time with a distinct zero reference line.
- [ ] **AC-4.5**: The Historical Table displays all 48 settlement periods per day with sorting, pagination, and data status flags.
- [ ] **AC-4.6**: A CSV export feature downloads the filtered interval analysis.
- [ ] **AC-4.7**: The layout is fully responsive, supporting mobile (<768px), tablet, and desktop screens without horizontal body overflow.

### 5. Quality & Architecture
- [ ] **AC-5.1**: Backend automated tests (Pytest) verify forecast selection, cutoff enforcement, metric accuracy, and edge cases.
- [ ] **AC-5.2**: Frontend builds cleanly with zero TypeScript errors (`tsc --noEmit`) and passes Vitest component tests.
- [ ] **AC-5.3**: Docker Compose starts both frontend and backend seamlessly with `docker compose up --build`.
- [ ] **AC-5.4**: A comprehensive README documents the architecture, setup instructions, data sources, and limitations.
