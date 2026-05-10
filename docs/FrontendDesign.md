# Frontend Design System — CachedThreads

This document describes the visual design language, component architecture, and styling conventions used in the CachedThreads frontend. It is the source of truth for any UI work going forward.

---

## Design Philosophy

The target aesthetic is a **premium glassmorphic productivity OS** — inspired by Linear, Arc Browser, Raycast, and Apple's spatial design. The guiding principles are:

- **Layered, not flat** — surfaces sit at different elevations with light, shadow, and blur creating depth
- **Soft, not flashy** — translucency and blur are tasteful; no heavy drop shadows or neon gradients
- **Structured, not empty** — whitespace is intentional; panels have internal visual hierarchy
- **Tactile** — interactive elements respond to hover with subtle lift, tint, and glow
- **Readable** — strong typographic hierarchy; muted metadata never competes with primary content

---

## Color Palette

### App Backgrounds

| Token | Light | Dark | Usage |
|---|---|---|---|
| App shell | `#eeeef3` | `#070710` | Outermost layer |
| TabBar | `rgba(255,255,255,0.60)` | `rgba(10,10,20,0.85)` | Top nav strip |
| Panel surface | see `.surface` | see `.surface` | Main content panels |

### Neutral tones (Tailwind)

Used for borders, dividers, and text hierarchy:

- `black/[0.05–0.08]` / `white/[0.05–0.09]` — dividers and subtle borders
- `gray-300–400` (light) / `gray-600–700` (dark) — secondary/muted text
- `gray-700–900` (light) / `gray-100–300` (dark) — primary text

### Accent — Indigo/Violet

The primary interactive color is indigo (`#6366f1`) with violet overtones:

- Buttons, active tabs, selected states: `bg-indigo-500`
- Shadows: `shadow-indigo-500/25–35`
- Focus rings: `rgba(99,102,241,0.10–12)`

### Workspace Colors

Each workspace has a user-assigned color from a fixed palette of 9 options. Colors are stored as hex values in the context JSON (`color` field). The palette:

| Name | Hex |
|---|---|
| Violet (default) | `#8b5cf6` |
| Indigo | `#6366f1` |
| Blue | `#3b82f6` |
| Cyan | `#06b6d4` |
| Emerald | `#10b981` |
| Rose | `#f43f5e` |
| Orange | `#f97316` |
| Amber | `#f59e0b` |
| Slate | `#94a3b8` |

Workspace colors are used for:
- Colored dot in the TabBar workspace tab
- Active tab underline gradient
- Left accent bar on task rows in TodoList
- Filter pill active state in TodoList
- Workspace tag color on row hover

Colors fall back to Violet (`#8b5cf6`) when unset.

### Card Type Colors

Card types use a fixed color accent system. Tailwind classes only (no inline styles):

| Type | Left border | Badge |
|---|---|---|
| Task | `border-l-indigo-400/80` | indigo |
| Note | `border-l-emerald-400/80` | emerald |
| Video | `border-l-rose-400/80` | rose |
| Snippet | `border-l-amber-400/80` | amber |
| Link | `border-l-cyan-400/80` | cyan |
| File | `border-l-slate-400/80` | slate |

### Kanban Column Colors

Columns use extremely muted tints to distinguish lanes without visual noise:

| Column | Background | Border |
|---|---|---|
| Pending | `bg-amber-500/[0.035]` | `border-amber-200/30` |
| In Progress | `bg-blue-500/[0.035]` | `border-blue-200/30` |
| Done | `bg-emerald-500/[0.025]` | `border-emerald-200/25` |

---

## Surface Elevation System

Three surface levels defined in `index.css`:

### `.surface` — Primary panels

The base glass unit. Used for Dashboard panels, sidebar.

```css
/* Light */
background: rgba(255, 255, 255, 0.60);
backdrop-filter: blur(24px) saturate(180%);
border: 1px solid rgba(255, 255, 255, 0.50);
box-shadow: inset highlight + ambient soft shadow

/* Dark */
background: rgba(16, 16, 26, 0.78);
border: 1px solid rgba(255, 255, 255, 0.065);
box-shadow: strong ambient dark shadow
```

### `.surface-raised` — Inner panels, hover cards

Slightly brighter and less blurred than `.surface`. Used for interactive inner panels or secondary containers nested inside a `.surface`.

### `.surface-overlay` — Modals, command bar

Maximum blur and opacity. Used for floating UI that sits above all content.

```css
/* Light */
background: rgba(255, 255, 255, 0.88);
backdrop-filter: blur(40px) saturate(200%);

/* Dark */
background: rgba(14, 14, 22, 0.92);
```

**Rule:** Never use `bg-white` or `bg-gray-*` directly on panels — always use the surface hierarchy.

---

## Typography

Font stack: `-apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Text', 'Segoe UI', sans-serif`

Font smoothing: `antialiased` globally.

### Size scale in use

| Role | Size | Weight | Color |
|---|---|---|---|
| Panel heading | `text-[15px]` / `text-[17px]` | `font-bold` or `font-semibold` | `text-gray-900 dark:text-white` |
| Section label | `.section-label` (10px, semibold, uppercase, tracked) | — | muted gray |
| Body / card content | `text-[13px]` | `font-[450]` | `text-gray-700 dark:text-gray-300` |
| Metadata / timestamps | `text-[11px]` | normal / `font-mono` | `text-gray-300 dark:text-gray-700` |
| Badge label | `text-[10px]` | `font-semibold` | per type |

### `.section-label` utility

Defined in `index.css`. Use for all panel headers and section titles:

```css
font-size: 10px;
font-weight: 600;
letter-spacing: 0.1em;
text-transform: uppercase;
color: rgba(107, 114, 128, 0.65); /* light */
color: rgba(75, 85, 99, 0.85);   /* dark */
```

Always pair a `.section-label` with a larger heading beneath it for hierarchy:
```jsx
<p className="section-label">Schedule</p>
<p className="text-[14px] font-semibold text-gray-800 dark:text-gray-100 mt-0.5">Monday</p>
```

---

## Interactive States

### Row hover — `.row-interactive`

Used for clickable list items (task rows, nav items) that don't need full card elevation:

```css
transition: background 120ms ease;
hover: background: rgba(0,0,0,0.028) /* light */
hover: background: rgba(255,255,255,0.035) /* dark */
```

Use `rounded-xl` with `.row-interactive`. Add `group` for child transitions.

### Card hover — `.kanban-card`

Full kanban card with glass surface and cubic-bezier lift:

```css
transition: transform 160ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 160ms, background 120ms;
hover: translateY(-2px) + elevated shadow + brighter background
```

### Button hover

All interactive buttons use `transition-all duration-150`. Primary buttons (indigo) add `hover:-translate-y-0.5 hover:shadow-lg`.

Ghost/icon buttons use `hover:bg-black/[0.05] dark:hover:bg-white/[0.06]` for the tint.

### Focus ring — `.focus-ring`

Applied to all form inputs:

```css
focus: border-color: rgba(99,102,241,0.50)
focus: box-shadow: 0 0 0 3px rgba(99,102,241,0.12)
```

---

## Shadows

Never use `shadow-lg` or dark drop shadows directly. Use these patterns:

| Level | Shadow |
|---|---|
| Ambient panel | `0 8px 32px -8px rgba(0,0,0,0.08)` |
| Kanban card | `0 2px 8px -2px rgba(0,0,0,0.06)` |
| Kanban hover | `0 8px 24px -6px rgba(0,0,0,0.10)` |
| Indigo button | `shadow-md shadow-indigo-500/25` → hover `shadow-lg shadow-indigo-500/35` |
| Now indicator | `.now-glow` — `0 0 8px 2px rgba(99,102,241,0.30)` |

Dark mode shadows are 4–6× stronger to compensate for the dark background absorbing light.

---

## Animations

| Name | Usage |
|---|---|
| `.shimmer` | Loading skeletons (replaces `animate-pulse`) |
| `animate-pulse` | Saving indicator dot only |
| Kanban lift | `cubic-bezier(0.34, 1.56, 0.64, 1)` — slight overshoot for tactility |
| `.now-glow` | Current time indicator pulse shadow |
| `transition-all duration-150` | Default for buttons and interactive elements |
| `transition-all duration-200` | Kanban cards and elevation changes |

---

## Component Reference

### App shell (`App.jsx`)

- **Background**: two radial ambient gradients (indigo top-left, violet bottom-right) + sky center. `blur-[80–120px]`.
- **TabBar**: `h-11`, `backdrop-blur-2xl`, top highlight line gradient.
- **Active tab**: `bg-black/[0.07] dark:bg-white/[0.09]` + `.tab-active-bar` (colored gradient underline using workspace color or indigo default).
- **Workspace dot**: renders as a `<button>` inside the tab. Click opens `ColorPickerPopover`. Uses workspace color via inline `style`.
- **`ColorPickerPopover`**: 3×3 grid of swatch buttons. Closes on outside click. Positioned `top-full left-0` relative to the tab wrapper.

### Dashboard (`Dashboard.jsx`)

Three-column layout: `w-[200px]` schedule | `flex-1` in-progress | `w-[260px]` clipboard. All panels use `.surface` + `rounded-2xl`.

### SchedulePanel (`SchedulePanel.jsx`)

- Hours 7am–9pm rendered as rows with time label + spine + block
- Current hour: `indigo-50` background, progress bar `from-indigo-500 to-violet-500`, `.now-glow` dot
- Past hours: `opacity-25`
- Free blocks: near-transparent with dashed `—` label

### TodoList (`TodoList.jsx`)

- Each task row: `.row-interactive` + `rounded-xl` + workspace **color accent bar** (`w-0.5 h-7`) as leftmost element
- State dot: blue (ongoing) or amber (pending) with glow shadow
- Workspace tag: appears on hover, colored with workspace hex, with arrow icon
- **Workspace filter bar**: pill row above the pending toggle footer. Pills use inline styles for active state (color tint background + border). "All" pill uses neutral style.
- **Pending toggle footer**: text button + item count. Always rendered.

### ClipboardPanel (`ClipboardPanel.jsx`)

- Full-height `<textarea>` with monospace font, `text-[12.5px]`, line-height 1.75
- Footer status dot: pulses indigo when saving, solid emerald when saved, gray when empty
- Auto-saves with 900ms debounce

### Workspace / KanbanBoard (`Workspace.jsx`)

- Header: `bg-white/25 dark:bg-white/[0.018]` frosted strip with workspace name + card count
- Kanban grid: `grid-cols-3 gap-3.5` inside `px-5 py-4`
- Columns: `rounded-2xl` with column-specific muted tint + border
- Cards: `.kanban-card` CSS class (defined in `index.css`) — glass surface, left border accent by type
- Empty column: dashed circle + muted label

### CardModal (`CardModal.jsx`)

- Backdrop: `bg-black/25 dark:bg-black/45 backdrop-blur-sm`
- Modal: `.surface-overlay` + `rounded-2xl` + per-type border color
- Top gradient stripe: `bg-gradient-to-b` from type color — adds ambient tint behind the header
- Type selector: pill buttons, active = `bg-indigo-500 text-white`
- State selector: per-state active color (amber / blue / emerald)
- All inputs: shared `inputClass` constant with `bg-white/50`, `rounded-xl`, focus ring

---

## File Map

```
frontend/src/
├── index.css                          ← Design system: .surface, .kanban-card, .row-interactive, etc.
├── App.jsx                            ← TabBar, AppShell, ColorPickerPopover, WORKSPACE_COLORS
├── context/ThemeContext.jsx           ← dark/light toggle, localStorage persistence
├── components/
│   ├── Dashboard/
│   │   ├── Dashboard.jsx              ← 3-panel layout
│   │   ├── SchedulePanel.jsx          ← Hour timeline
│   │   ├── TodoList.jsx               ← Task list + workspace filter bar + color tinting
│   │   └── ClipboardPanel.jsx         ← Auto-save scratch pad
│   ├── Workspace/
│   │   └── Workspace.jsx              ← Kanban board with CardItem + KanbanCard styles inline
│   └── Cards/
│       └── CardModal.jsx              ← Create/edit card modal
└── hooks/
    ├── useContexts.js                 ← contexts list + createContext + updateContextColor
    └── useCards.js                    ← cards CRUD for a single workspace
```

---

## Data Flow for Workspace Colors

1. User clicks the colored dot in a workspace tab in `TabBar`
2. `ColorPickerPopover` renders with the current hex and `WORKSPACE_COLORS` palette
3. User selects a color → `updateContextColor(id, hex)` is called
4. Hook calls `PUT /api/contexts/:id` with `{ color: hex }`
5. Backend persists `color` to the context JSON file
6. Hook calls `refresh()` → `GET /api/contexts` → contexts re-render with new color
7. `TodoList` re-fetches on next mount and picks up new colors from the list endpoint

Color is stored as a raw hex string (e.g. `"#8b5cf6"`) in the context JSON. It is served back through the `GET /api/contexts` list response alongside `id`, `name`, `created_at`, and `summary`.

---

## Do's and Don'ts

**Do:**
- Use `.surface`, `.surface-raised`, `.surface-overlay` for all panel backgrounds
- Use `.kanban-card` for kanban items (never inline the box-shadow / backdrop-filter)
- Use `.row-interactive` for hoverable list rows
- Use `.section-label` for all section/panel headers
- Use inline `style` for dynamic colors derived from workspace hex values
- Use `transition-all duration-150` on interactive elements
- Use `rounded-xl` on rows, `rounded-2xl` on panels and modals

**Don't:**
- Don't use `bg-white`, `bg-gray-*`, or `bg-zinc-*` directly on panels
- Don't add `shadow-lg` or `drop-shadow-*` without referencing the shadow table above
- Don't use neumorphic styles (dual inset shadows simulating physical depth)
- Don't use heavily saturated gradient backgrounds on panels
- Don't add new global CSS classes without documenting them in this file
- Don't scatter one-off inline styles — if a pattern repeats 3+ times, add a CSS class
