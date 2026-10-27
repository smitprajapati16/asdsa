# Product Requirements Document (PRD)
## WindScope — UK Wind Forecast Intelligence

### 1. Document Overview
- **Product Name**: WindScope — UK Wind Forecast Intelligence
- **Evaluation Period**: January 1, 2026 – January 31, 2026
- **Status**: Ready for Implementation
- **Version**: 1.0.0

---

### 2. Business Problem & Context
A UK electricity utility purchases wholesale power to meet customer demand and balance its portfolio. Wind generation is variable and intermittent, creating forecasting uncertainty.

The wholesale purchasing team makes critical hedging and procurement decisions across multiple time horizons:
- **Day-Ahead (D-1)**: Setting baseline purchase schedules and bidding in Day-Ahead power auctions (e.g. EPEX SPOT, Nord Pool) around 11:00 / 12:00 GMT.
- **Intraday / Gate Closure (1 hour ahead)**: Fine-tuning balancing positions prior to the Balancing Mechanism Gate Closure.

To evaluate past purchasing conditions and assess supplier/system operator forecast credibility during January 2026, the team needs an objective, decision-grounded dashboard that reconstructs what forecasts were known *at the moment decisions had to be made*, comparing those forecasts to actual wind power delivered to the National Grid.

---

### 3. Business Limitations & Non-Goals
To maintain strict data integrity and commercial realism:
- **No trade transaction data**: The application does not ingest private trade books, volume nominations, prices, or portfolio contracts.
- **No speculative financial P&L**: It will not fabricate hypothetical trading savings, imbalance cash-out losses, or "optimal" purchase volumes.
- **Decision support, not automated trading**: WindScope is an observational analytics and validation dashboard, not an algorithmic execution engine.
- **Strict date bounding**: The primary scope is strictly bounded to January 2026 (48 half-hour settlement periods per day, 1,488 settlement intervals across the month).

---

### 4. Target Users & Key Personas
1. **Wholesale Power Purchaser / Trader**:
   - Needs to know: *How much could I trust the wind forecast 1 hour before delivery vs. 24 hours before delivery? Did forecasts systematically overestimate or underestimate generation?*
2. **Energy Risk & Strategy Analyst**:
   - Needs to know: *What was the overall MAE, RMSE, and bias across January 2026? How did forecast errors distribute across peak vs. off-peak hours and storm events?*
3. **Data Operations & Settlement Analyst**:
   - Needs to know: *Were there any missing forecast runs or data gaps from Elexon BMRS during January 2026? What publication timestamps were utilized?*

---

### 5. Product Goals
1. **Decision Cutoff Grounding**: Guarantee that forecasts are strictly selected using the most recent publication timestamp available *on or prior to* the chosen decision cutoff (e.g. 1 hour prior to delivery by default).
2. **Empirical Accuracy Metrics**:
   - Mean Absolute Error (MAE in MW)
   - Root Mean Squared Error (RMSE in MW)
   - Forecast Bias / Mean Error (Signed MW)
   - Total intervals evaluated and match completeness percentage.
3. **Interactive & Responsive Exploration**:
   - Responsive time-series charts (Forecast vs Actual, Error over time with 0 reference line).
   - Historical tabular inspection with per-interval status, publish times, and error breakdown.
   - Presets for January 2026 full month, single days, and customizable decision cutoff lead times (1h, 2h, 4h, 12h, 24h, Day-Ahead 12:00 D-1).
4. **Data Transparency & Integrity**:
   - Clear indicators for data source (Elexon BMRS Insights Solution), fetch timestamp, missing delivery intervals, and data health.
   - Never silently substitute synthetic data for live API data.

---

### 6. User Stories
- **US1**: As a power purchaser, I want to filter the dashboard to any date range within January 2026 so that I can analyze high-wind or stormy days separately from calm periods.
- **US2**: As a power purchaser, I want to change the decision cutoff lead time (e.g., from Gate Closure 1h to Day-Ahead 24h) to see how forecast accuracy degrades further from real-time.
- **US3**: As a risk analyst, I want to see KPI cards showing MAE, RMSE, and Bias with clear definitions and MW units so that I can report monthly forecast performance to management.
- **US4**: As an energy analyst, I want a dual-axis/interactive chart comparing forecast and actual MW curves, with detailed hover tooltips displaying publish timestamps and error deltas.
- **US5**: As a data operations analyst, I want a comprehensive table of all 48 settlement periods with sorting, pagination, and data status flags to audit individual interval discrepancies.
- **US6**: As an analyst on a mobile device, I want a responsive, touch-friendly UI that scales smoothly across mobile, tablet, and desktop viewports.
