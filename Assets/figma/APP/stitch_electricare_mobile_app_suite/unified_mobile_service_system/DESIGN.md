---
name: Unified Mobile Service System
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#424656'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#727687'
  outline-variant: '#c2c6d8'
  surface-tint: '#0054d6'
  primary: '#0050cb'
  on-primary: '#ffffff'
  primary-container: '#0066ff'
  on-primary-container: '#f8f7ff'
  inverse-primary: '#b3c5ff'
  secondary: '#a04100'
  on-secondary: '#ffffff'
  secondary-container: '#fe6b00'
  on-secondary-container: '#572000'
  tertiary: '#006646'
  on-tertiary: '#ffffff'
  tertiary-container: '#00825a'
  on-tertiary-container: '#e1ffec'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae1ff'
  primary-fixed-dim: '#b3c5ff'
  on-primary-fixed: '#001849'
  on-primary-fixed-variant: '#003fa4'
  secondary-fixed: '#ffdbcc'
  secondary-fixed-dim: '#ffb693'
  on-secondary-fixed: '#351000'
  on-secondary-fixed-variant: '#7a3000'
  tertiary-fixed: '#85f8c4'
  tertiary-fixed-dim: '#68dba9'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#005137'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '800'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 30px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 26px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
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
    lineHeight: 18px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.02em
  currency-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '800'
    lineHeight: 34px
    letterSpacing: -0.02em
  currency-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 24px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-compact: 0.75rem
  margin: 1rem
  margin-expanded: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system delivers a high-trust, mission-critical mobile infrastructure uniting three interdependent user groups across on-demand technical services:

1. **Customers**: Urban households and office managers seeking immediate, safe, and transparently priced electrical repairs.
2. **Technicians**: Certified field specialists requiring clear task dispatching, active navigation, strict safety checklists, digital proof-of-work capture, and instant earnings tracking.
3. **Partners & Fleet Managers**: Regional franchise and operations partners overseeing technician pools, regional job escalations, pin code allocations, and daily payout margins.

### Design Movement
The style blends **Modern Corporate Utility** with **Tactile Field Usability**. Visual design prioritizes immediate readability under extreme lighting (direct sunlight for technicians, dim indoor spaces for consumers during outages), absolute information density without visual clutter, crisp structural card elevation, and purposeful micro-interactions that confirm physical safety actions and monetary verifications.

### Voice & Demeanor
- **Dependable & Authoritative**: High-contrast typography and precise state badging eliminate ambiguity during high-stress electrical faults.
- **Safety-Centric**: Critical checkpoints (e.g., mains disconnection, voltage testing, OTP verification) command deliberate user confirmation with dedicated status signaling.
- **Transparent**: Financial structures—particularly Indian Rupee (₹) amounts, tax breakdowns (CGST/SGST), and technician earnings—are displayed with numeric clarity and zero cognitive load.

## Colors

The system uses a role-partitioned palette built around a core trusted blue, complemented by functional role accents and explicit status signaling.

### Role Partitioning
- **Core Platform & Customer Interface**: Primary Deep Electric Blue (`#0066FF`, active shade `#0B57D0`) establishes platform authority, reliability, and technical competence.
- **Technician Field Interface**: Vibrant Safety Orange (`#FF6B00`, deep tone `#E65100`) serves as the primary action and verification hue for field work, echoing electrical hazard gear and high-visibility work uniforms.
- **Partner Fleet Interface**: Forest Trust Green (`#059669`, vibrant shade `#16A34A`) anchors the managerial and operational views, signaling steady revenue, compliance, and technician health.

### Semantic Status Palette
- **Pending / Action Needed**: Warm Amber (`#F59E0B` / background `#FEF3C7`)
- **Assigned / In Review**: Slate Blue (`#3B82F6` / background `#EFF6FF`)
- **En Route / Live Transit**: Cyan Teal (`#0891B2` / background `#ECFEFF`)
- **Arrived / Check-in**: Purple Accent (`#8B5CF6` / background `#F5F3FF`)
- **Work Started / In Progress**: Safety Orange (`#FF6B00` / background `#FFF7ED`)
- **Completed / Verified**: Forest Emerald (`#059669` / background `#ECFDF5`)
- **Escalated / Emergency**: Vivid Crimson (`#DC2626` / background `#FEF2F2`)
- **Cancelled / Void**: Neutral Gray (`#64748B` / background `#F1F5F9`)

### Surface & Neutral Architecture
- Canvas Surface: Crisp Slate Light (`#F8FAFC`)
- Card & Container Surface: Pure White (`#FFFFFF`)
- Text Primary: Deep Slate Charcoal (`#0F172A`)
- Text Secondary: Muted Slate (`#475569`)
- Ghost Outlines & Card Borders: Soft Subtle Stroke (`#E2E8F0`)

## Typography

The type scale combines **Plus Jakarta Sans** for headlines, metrics, and price blocks with **Inter** for dense UI strings, inputs, checklists, and metadata.

### Currency & Metric Representation
All financial amounts must be formatted with the Indian Rupee symbol prefix (`₹`) followed immediately by the numerical value using standard Indian numbering format (e.g., `₹1,250`, `₹32,500`, `₹4,20,000`). The rupee glyph inherits the weight of the active text style and must not have trailing space.

### Readability Specifications
- Headings maintain a snug negative letter-spacing (`-0.01em` to `-0.02em`) to guarantee punchy vertical lockups on 360dp–412dp standard mobile screens.
- Body text utilizes standard neutral letter-spacing with an accessible line-height multiplier between 1.4x and 1.5x to preserve scanning clarity on field inspections.

## Layout & Spacing

The mobile layout system operates strictly on a **4-column fluid mobile grid** within standard safe areas, optimized for single-hand reachability and touch targets:

- **Mobile Viewport Grid**: 4 columns with standard 16px (`1rem`) gutters and 16px lateral screen margins. Compact modal dialogs and split action bars collapse down to 12px (`gutter-compact`).
- **Vertical Spacing Rhythm**: Multiples of 4px and 8px dictate component internal rhythm:
  - Tight icon-to-label gap: 4px–8px (`space-xs` to `space-sm`)
  - List item vertical padding: 12px (`space-md`)
  - Standard card interior padding: 16px (`space-lg`)
  - Section-to-section separation: 24px (`space-xl`)
- **Bottom Navigation and Fixed CTA Clearance**: Fixed floating bottom sheets, sticky CTA bars, and tab bars require a default clearance buffer of 80px above the device navigation bar.

## Elevation & Depth

Visual hierarchy uses a refined hybrid approach: crisp, low-opacity ambient shadows combined with subtle 1px structural outlines. Pure white container cards pop against the `#F8FAFC` slate canvas without visual weight or muddy borders.

### Elevation Levels
- **Level 0 (Flat / Canvas)**: Background `#F8FAFC`. Zero elevation, flush with viewport.
- **Level 1 (Card / List Item)**: Surface `#FFFFFF`, border `1px solid #E2E8F0`, shadow `0 1px 3px rgba(15, 23, 42, 0.05), 0 1px 2px rgba(15, 23, 42, 0.03)`.
- **Level 2 (Interactive Card / Active Task)**: Surface `#FFFFFF`, border `1px solid #CBD5E1`, shadow `0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04)`.
- **Level 3 (Sticky CTA Bar / Floating Sheets)**: Surface `#FFFFFF`, border-top `1px solid #E2E8F0`, shadow `0 -4px 12px rgba(15, 23, 42, 0.06)`.
- **Level 4 (Modal / OTP Pin Surface / Live Alerts)**: Surface `#FFFFFF`, shadow `0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.08)`.

## Shapes

The interface embraces a balanced modern radius hierarchy (`roundedness: 2`) tuned for mobile touch ergonomics:

- **Primary Cards and Containers**: 12px to 16px corner radius (`rounded-lg` / `rounded-xl`), creating soft enclosures that frame service details and invoice blocks.
- **Action Buttons & Inputs**: 10px to 12px corner radius for standard field elements, matching the interior curvature of parent cards.
- **Micro Badges, Chips & Avatars**: Full pill radius (9999px) for status indicators, counter badges, category filters, and technician portraits to distinguish actionable and semantic indicators from rectangular structural content.
- **Camera/Photo Capture Frames**: 12px radius with recessed dashed bounding strokes for "Before & After" proof submissions.

## Components

### Buttons & Sticky Action Trays
- **Primary Action Buttons**: Height 48px to 52px for full touch-target accessibility. Filled using the active role primary: Customer Blue (`#0066FF`), Technician Orange (`#FF6B00`), or Partner Green (`#059669`). Text is bold white (`#FFFFFF`) with centered label.
- **Secondary Buttons**: Transparent surface with 1.5px border matching the respective role hue, or subtle tinted background (10% tint) with solid text.
- **Full-Width Sticky Bottom Bar**: Pinned to the viewport bottom with safe-area spacing. Encloses primary action, price summary or SLA countdown, and optional secondary action (e.g., "Retake" vs. "Use Photo").

### Status Badges & Indicators
- Badges use pill shapes with 6px vertical padding and 12px horizontal padding.
- Structure: 6px solid dot indicator + uppercase or medium label (e.g., `• Work Started`, `• Arrived`, `• Escalated`).
- Color mappings:
  - *Pending*: Amber background (`#FEF3C7`), text & dot (`#D97706`).
  - *Assigned*: Blue background (`#EFF6FF`), text & dot (`#2563EB`).
  - *En Route*: Cyan background (`#ECFEFF`), text & dot (`#0891B2`).
  - *Work Started*: Orange background (`#FFF7ED`), text & dot (`#EA580C`).
  - *Completed*: Green background (`#ECFDF5`), text & dot (`#059669`).
  - *Escalated*: Red background (`#FEF2F2`), text & dot (`#DC2626`).

### Service Cards & Job Cards
- Built with a white surface, 1px border (`#E2E8F0`), and Level 1 elevation.
- Internal layout: Top row displays Job ID (e.g., `#J-1001`) with Status Badge; middle block presents title, category thumbnail, timestamp, and address; bottom row houses the formatted price (`₹1,250`) alongside explicit navigation/action buttons.

### Safety Checklist Component
- High-visibility interactive card with 44px tap targets.
- Green checkbox state with solid check icon upon verification (e.g., "Wearing 1000V Insulated Gloves", "Main MCB Switched OFF").
- Locked sequence behavior: subsequent execution steps remain disabled until all safety items are checked.

### OTP Completion Block
- Centered 4-digit input field with discrete 56px × 56px rounded rectangular boxes, 2px focus border, and 24px bold numeric display for final handover verification between customer and technician.

### Input Fields & Search Bars
- Background `#FFFFFF` or `#F1F5F9`, border 1px solid `#CBD5E1`.
- Active focus state: 2px border matching role brand color with 0 0 0 3px tinted focus ring.
- Explicit label sits outside/above the field in `label-md` Slate Charcoal (`#0F172A`).