# UI/UX Specification
## WindScope — UK Wind Forecast Intelligence

### 1. Design Philosophy & Aesthetic
- **Domain**: Professional Energy Analytics & Trading Decision Support.
- **Theme**: Clean, restrained, high-contrast, modern utility dashboard.
- **Tone**: Objective, precise, operational.
- **Anti-patterns to avoid**:
  - Flashy AI landing page gradients
  - Gimmicky glowing cards or low-contrast neomorphism
  - Cartoonish icons
  - Fake or ungrounded financial claims

### 2. Design Tokens & Palette

| Token Name | Hex Code | Purpose |
|---|---|---|
| `--color-primary-green` | `#15803D` | Primary green for brand accent, key forecast curve, active buttons |
| `--color-dark-green-hover` | `#166534` | Dark green for button hover states |
| `--color-main-text` | `#182230` | Main text color for high legibility |
| `--color-secondary-text` | `#667085` | Secondary text for captions, column headers, and labels |
| `--color-page-bg` | `#F7F8F7` | Light neutral page background |
| `--color-surface` | `#FFFFFF` | Clean white card, header, and table surfaces |
| `--color-borders` | `#E5E7EB` | Subtle, clean border dividers |
| `--color-subtle-green` | `#F0FDF4` | Subtle green background for badges and icon containers |
| `--color-error` | `#B42318` | Restrained error crimson |
| `--color-warning` | `#B54708` | Restrained warning amber |

### 3. Layout Structure & Responsive Breakpoints

#### Viewports
- **Mobile (< 768px)**: Single column stack, collapsed filter drawer or toggleable filter sheet, horizontally scrollable data table, touch-sized tap targets (min 44px).
- **Tablet (768px – 1024px)**: 2-column KPI grid, full-width charts, sticky table header.
- **Desktop (> 1024px)**: 4-column KPI cards, side-by-side or stacked deep charts, responsive data table with sorting and pagination controls.

#### Page Sections
1. **AppHeader**:
   - Logo / App Title: "WindScope — UK Wind Forecast Intelligence"
   - Evaluation Period Badge: "January 2026 (UK Grid / BMRS)"
   - System Status / Last Data Sync indicator.
2. **Filter & Control Bar**:
   - Quick date buttons: "Full Jan 2026", "Jan 1–7 (Week 1)", "Jan 8–14", "Storm Event (Jan 24–26)", "Single Day"
   - Date range pickers (strictly bounded between 2026-01-01 and 2026-01-31)
   - Decision Cutoff Selector:
     - Preset dropdown: Gate Closure (1h prior, default), 2h ahead, 4h ahead, 12h ahead, 24h ahead, Day-Ahead 12:00 D-1.
   - Reset button.
3. **KPI Metric Grid**:
   - Card 1: **Mean Absolute Error (MAE)** (MW, with explanation tooltip)
   - Card 2: **Root Mean Squared Error (RMSE)** (MW, penalizes large spikes)
   - Card 3: **Forecast Bias** (MW, signed direction: Overestimating vs Underestimating)
   - Card 4: **Coverage & Valid Matches** (e.g., "1488 / 1488 Intervals (100%)")
4. **Primary Charts**:
   - **Chart 1: Forecast vs. Actual Generation (MW over time)**
     - Area / Line overlay showing Actual (Blue) vs Forecast (Teal).
     - Hover tooltip showing settlement period, date, time, forecast MW, actual MW, delta MW, and forecast publication time.
   - **Chart 2: Forecast Error Delta Curve (MW)**
     - Error line with reference zero line.
     - Color-coded divergence showing over-forecast (+MW) and under-forecast (-MW).
5. **Historical Settlement Intervals Table**:
   - Columns: Settlement Date, Period (1–48), Interval Time (UTC), Actual (MW), Forecast (MW), Error (MW), Absolute Error (MW), Publish Time, Status (Matched / Missing).
   - Features: Column sorting (by Error, Time, MW), Pagination (10, 24, 48 rows per page), CSV Export.
6. **Data Quality & Assumption Notice**:
   - Explanatory footnote summarizing Elexon BMRS data feeds, UTC/GMT market clock rules, and cutoff decision logic.

### 4. Accessibility & States
- **Loading State**: Subtle skeleton loaders for KPI cards and charts during API fetches.
- **Empty State**: Friendly, clear graphic and message if no intervals match filters.
- **Error State**: Informative banner with retry button if Elexon upstream or backend responds with error.
- **ARIA & Keyboard**: Tab-accessible inputs, proper `<label>` associations, high-contrast text ratios exceeding WCAG AA.
