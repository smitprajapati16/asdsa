# Data Specification
## WindScope — UK Wind Forecast Intelligence

### 1. External Datasets (Elexon BMRS Insights Solution)

WindScope integrates with the official Elexon Insights Solution REST API (formerly BMRS).

#### 1.1 Actual Generation: `FUELHH` (Half-Hourly Generation by Fuel Type)
- **Endpoint**: `https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream`
- **Primary Filter**: `fuelType = "WIND"`
- **Key Fields**:
  | Field | Type | Description | Example |
  |---|---|---|---|
  | `dataset` | string | Constant identifier | `"FUELHH"` |
  | `startTime` | ISO 8601 string | Start of half-hour settlement interval | `"2026-01-01T00:00:00Z"` |
  | `settlementDate` | string (YYYY-MM-DD) | UK settlement calendar date | `"2026-01-01"` |
  | `settlementPeriod` | integer (1–48) | Settlement period index of the day | `1` |
  | `fuelType` | string | Generation fuel type | `"WIND"` |
  | `generation` | integer/float (MW) | Total actual generation delivered in MW | `14202` |
  | `publishTime` | ISO 8601 string | Timestamp record was published to BMRS | `"2026-01-01T00:45:00Z"` |

#### 1.2 Forecast Generation: `WINDFOR` (Wind Generation Forecast)
- **Endpoint**: `https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR/stream`
- **Key Fields**:
  | Field | Type | Description | Example |
  |---|---|---|---|
  | `dataset` | string | Constant identifier | `"WINDFOR"` |
  | `startTime` | ISO 8601 string | Target delivery interval start time | `"2026-01-01T00:00:00Z"` |
  | `generation` | integer/float (MW) | Predicted total wind generation in MW | `14500` |
  | `publishTime` | ISO 8601 string | Timestamp forecast run was published | `"2025-12-31T22:30:00Z"` |

---

### 2. Timezone & Temporal Semantics
- **Internal Storage & Computation**: All internal timestamps are parsed, compared, and stored in UTC (ISO 8601 `Z`).
- **UK Market Clock**:
  - January in the UK operates entirely in Greenwich Mean Time (GMT / UTC+00:00).
  - British Summer Time (BST / UTC+01:00) does not apply to January, eliminating daylight-saving clock change ambiguities (e.g. 46 or 50 settlement periods). Every complete January day has exactly 48 settlement periods.
- **Delivery Intervals**:
  - Period 1: 00:00 to 00:30 UTC
  - Period 2: 00:30 to 01:00 UTC
  - ...
  - Period 48: 23:30 to 00:00 (+1 day) UTC
  - Total intervals for January 2026 (31 days): $31 \times 48 = 1,488$ intervals.

---

### 3. Forecast Selection Logic (Decision Cutoff)

For each delivery interval $i$ with start time $T_{\text{start}}$:
1. Compute the decision cutoff $T_{\text{cutoff}}$:
   - **Gate Closure**: $T_{\text{cutoff}} = T_{\text{start}} - 1\text{ hour}$ (Default)
   - **2 Hours Ahead**: $T_{\text{cutoff}} = T_{\text{start}} - 2\text{ hours}$
   - **4 Hours Ahead**: $T_{\text{cutoff}} = T_{\text{start}} - 4\text{ hours}$
   - **12 Hours Ahead**: $T_{\text{cutoff}} = T_{\text{start}} - 12\text{ hours}$
   - **24 Hours Ahead**: $T_{\text{cutoff}} = T_{\text{start}} - 24\text{ hours}$
   - **Day-Ahead 12:00**: $T_{\text{cutoff}} = \text{Date}(T_{\text{start}} - 1\text{ day}) \text{ at 12:00:00Z}$
2. Candidate forecast set:
   $$S = \{ f \in \text{WINDFOR} \mid f.startTime == T_{\text{start}} \land f.publishTime \le T_{\text{cutoff}} \}$$
3. Selected forecast:
   $$f^* = \arg\max_{f \in S} (f.publishTime)$$
4. If $S = \emptyset$:
   Record as `missing_forecast`. Do not assume generation is 0. Exclude from MAE/RMSE calculations.

---

### 4. Mathematical Definitions of Metrics
Given $N$ valid matched delivery intervals $(f_i, a_i)$ where $f_i$ is selected forecast generation in MW and $a_i$ is actual generation in MW:

1. **Mean Absolute Error (MAE)**:
   $$\text{MAE} = \frac{1}{N} \sum_{i=1}^N |f_i - a_i| \quad [\text{MW}]$$

2. **Root Mean Squared Error (RMSE)**:
   $$\text{RMSE} = \sqrt{\frac{1}{N} \sum_{i=1}^N (f_i - a_i)^2} \quad [\text{MW}]$$

3. **Forecast Bias (Mean Signed Error)**:
   $$\text{Bias} = \frac{1}{N} \sum_{i=1}^N (f_i - a_i) \quad [\text{MW}]$$
   - $\text{Bias} > 0$: Overforecasting (actual generation lower than expected).
   - $\text{Bias} < 0$: Underforecasting (actual generation higher than expected).

4. **Percentage Error Caveat**:
   Mean Absolute Percentage Error (MAPE) is not used as a primary metric because wind generation can drop to near zero MW, creating asymptotic division errors or distorted percentages. Instead, error is reported in physical units (MW) alongside the mean generation volume for context.

---

### 5. Caching and Ingestion Strategy
- Because January 2026 data is historical, raw records from Elexon do not mutate.
- In-memory dataset store caches the fetched and parsed records by settlement date.
- Response payloads to the frontend are compressed and formatted for rapid client-side chart rendering.
