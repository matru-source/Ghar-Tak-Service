---
name: Mission-Critical Electrical SaaS
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#444653'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#757684'
  outline-variant: '#c4c5d5'
  surface-tint: '#3755c3'
  primary: '#00288e'
  on-primary: '#ffffff'
  primary-container: '#1e40af'
  on-primary-container: '#a8b8ff'
  inverse-primary: '#b8c4ff'
  secondary: '#006c4a'
  on-secondary: '#ffffff'
  secondary-container: '#82f5c1'
  on-secondary-container: '#00714e'
  tertiary: '#440098'
  on-tertiary: '#ffffff'
  tertiary-container: '#5f00d1'
  on-tertiary-container: '#c9aeff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b8c4ff'
  on-primary-fixed: '#001453'
  on-primary-fixed-variant: '#173bab'
  secondary-fixed: '#85f8c4'
  secondary-fixed-dim: '#68dba9'
  on-secondary-fixed: '#002114'
  on-secondary-fixed-variant: '#005137'
  tertiary-fixed: '#eaddff'
  tertiary-fixed-dim: '#d2bbff'
  on-tertiary-fixed: '#25005a'
  on-tertiary-fixed-variant: '#5a00c6'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-mobile: 0.75rem
  margin: 1.5rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

This design system targets industrial-grade field dispatch, partner coordination, and enterprise-level service tracking. The interface prioritizes high operational clarity, instant situational awareness, and friction-free data management under mission-critical timelines. 

Rooted in a **Corporate / Modern** aesthetic, the visual style combines structured utility with crisp micro-interactions:
- **Tone:** Authoritative, vigilant, reliable, and precise.
- **Aesthetic Structure:** High-density layouts, subtle border boundaries, low-contrast structural surfaces, and distinct functional color coding.
- **Cognitive Optimization:** Minimized unnecessary visual noise, ensuring immediate recognition of lifecycle events, SLA deadlines, dispatch statuses, and electrical grid alerts across desktop operations centers and mobile tablet field views.

## Colors

The palette establishes role-based functional zoning and immediate status legibility:

- **Primary (`#1E40AF`):** Royal Blue anchors standard system interactions, structural navigation, primary action buttons, and active workflow states.
- **Secondary (`#059669` / `#10B981`):** Forest Green designates partner-facing actions, positive completion milestones, verified technician checks, and healthy SLA operational metrics.
- **Tertiary (`#7C3AED` / `#6D28D9`):** Deep Purple designates administrative control, supervisor overrides, contract rate management, and cross-organization orchestration.
- **Neutrals:** Built on slate architecture:
  - Base canvas: `#F8FAFC` (Slate 50)
  - Surface cards & sheets: `#FFFFFF` (Pure White)
  - Structural borders & dividers: `#E2E8F0` (Slate 200)
  - Secondary text & metadata: `#64748B` (Slate 500)
  - Heavy primary text & titles: `#0F172A` (Slate 900)

### Status Badges & Lifecycle Colors
- **Pending:** Slate 100 background (`#F1F5F9`), Slate 700 text (`#334155`), Slate 300 border (`#CBD5E1`).
- **Assigned:** Blue 50 background (`#EFF6FF`), Blue 700 text (`#1D4ED8`), Blue 200 border (`#BFDBFE`).
- **En Route:** Sky 50 background (`#F0F9FF`), Sky 700 text (`#0369A1`), Sky 200 border (`#BAE6FD`).
- **Arrived:** Indigo 50 background (`#EEF2FF`), Indigo 700 text (`#4338CA`), Indigo 200 border (`#C7D2FE`).
- **Work Started:** Amber 50 background (`#FFFBEB`), Amber 800 text (`#92400E`), Amber 200 border (`#FDE68A`).
- **Completed:** Emerald 50 background (`#ECFDF5`), Emerald 700 text (`#047857`), Emerald 200 border (`#A7F3D0`).
- **Escalated:** Rose 50 background (`#FFF1F2`), Rose 700 text (`#BE123C`), Rose 200 border (`#FECDD3`).
- **Cancelled:** Zinc 100 background (`#F4F4F5`), Zinc 600 text (`#52525B`), Zinc 300 border (`#D4D4D8`).

## Typography

Typographic scale is strictly anchored to `Inter`, calibrated for optical legibility in high-density tables and technical dashboards:
- Numeric entries in tables, dispatch clocks, meter readings, and KPI stats must feature tabular lining figures (`font-variant-numeric: tabular-nums;`) to prevent layout shifting during real-time data sync.
- Micro-labels and uppercase column headers apply explicit letter-spacing (`+0.05em`) to ensure legibility at `11px` and `12px`.
- Body copy adheres to standard weights (`400`) while operational labels, statuses, and headings use medium (`500`), semibold (`600`), and bold (`700`) to guarantee an uncompromised structural hierarchy.

## Layout & Spacing

The system implements a responsive 12-column fluid grid tailored for wide-format operations screens, adapting seamlessly to 8 columns on tablets and 4 columns on mobile views:

- **Desktop (>= 1280px):** 12-column grid, `margin`: `1.5rem` (24px), `gutter`: `1rem` (16px). Maximum container width scales out to `1600px` for multi-pane dispatch screens.
- **Tablet (768px - 1279px):** 8-column grid, `margin`: `1.25rem` (20px), `gutter`: `1rem` (16px). Secondary sidebar collapses to an icon dock.
- **Mobile (< 768px):** 4-column grid, `margin-mobile`: `1rem` (16px), `gutter-mobile`: `0.75rem` (12px). Data tables collapse into stacked cards with sticky status bars.

Component internal rhythm strictly leverages the `space-*` scale to maintain dense vertical rhythm across forms, dispatch rows, and telemetry boards.

## Elevation & Depth

Visual hierarchy is maintained primarily via structural borders (`#E2E8F0`) and subtle, cool-toned ambient shadows. Surfaces do not rely on heavy blurs or dramatic drop shadows:

- **Base Floor (`#F8FAFC`):** Application canvas background.
- **Surface Level 1 (`#FFFFFF`):** Work order cards, metric panels, and table containers. Defined by a crisp border (`1px solid #E2E8F0`) and an ambient shadow: `0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.02)`.
- **Surface Level 2 (Hover & Active Overlays):** Interactive rows, sliding sheets, and floating filter popovers: `0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04)`.
- **Surface Level 3 (Modals & Critical Alerts):** Dispatch conflict modals and emergency notifications: `0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.03)` with a solid backdrop tint (`rgba(15, 23, 42, 0.45)`).

## Shapes

The design system enforces a **Soft** geometric structure (`roundedness: 1`):
- **Base Components (Inputs, Buttons, Badges):** `4px` (`0.25rem`) corner radius. This gives tools an intentional, utilitarian feel suitable for technical enterprise platforms.
- **Containers (Cards, Metric Tiles, Modal Dialogs):** `8px` (`0.5rem`, `rounded-lg`).
- **Interactive Badges & Status Chips:** `4px` (`0.25rem`) or fully rounded pill styles when applied strictly to counter badges and user avatars.

## Components

### Buttons
- **Primary:** Background `#1E40AF`, text `#FFFFFF`, hover `#1D4ED8`, active `#172554`. Height: 36px (compact) or 40px (standard). Border radius: 4px. Focus ring: 2px offset with `#3B82F6`.
- **Partner Action:** Background `#059669`, text `#FFFFFF`, hover `#047857`. Used for partner dispatch acknowledgments.
- **Admin Action:** Background `#7C3AED`, text `#FFFFFF`, hover `#6D28D9`. Used for overrides and contract edits.
- **Secondary:** Surface `#FFFFFF`, border `1px solid #E2E8F0`, text `#0F172A`, hover `#F8FAFC`.

### Badges & Status Indicators
- Height: 22px, padding: `2px 8px`, typography: `label-sm` (uppercase, tracking +0.05em).
- Border: `1px solid` matching the status tier border color.
- Includes a leading 6px circular dot indicator with 100% border radius matching the status text color.

### Data Tables (Dense Operational Display)
- **Header:** Height 36px, background `#F8FAFC`, border-bottom `1px solid #E2E8F0`, typography: `label-sm`, text `#64748B`.
- **Row:** Height 44px, cell padding `8px 12px`, alternating row striping optional (or plain white with `#F1F5F9` hover state). Border-bottom `1px solid #F1F5F9`.
- **Numeric alignment:** Right-aligned columns with tabular figures.

### Metric KPI Cards
- Background `#FFFFFF`, border `1px solid #E2E8F0`, border-radius: 8px, padding: 16px.
- Layout: Top row contains micro-label and contextual icon; middle displays the KPI metric in `headline-lg` (`24px` semibold); bottom row indicates SLA delta or trend chip (e.g., `+4.2%` in emerald or rose text).

### Form Inputs & Selects
- Height 36px, border `1px solid #CBD5E1`, background `#FFFFFF`, text `body-md` (`#0F172A`).
- Active/Focus: Border `#1E40AF`, ring `1px solid #1E40AF`.
- Error state: Border `#E11D48`, error helper text in `body-sm` (`#BE123C`).

### Clean Charts (Grid & Load Telemetry)
- Background: Transparent or clean white panel.
- Grid lines: Subtle dashed line `#E2E8F0` (`stroke-dasharray: 3 3`).
- Tooltip: High-contrast Slate 900 background (`#0F172A`), white text, no drop-shadow blur, 4px border radius.
- Series lines: 2px stroke width using Primary `#1E40AF`, Partner `#10B981`, and Admin `#8B5CF6`.