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
# CachedThreads — Feature Reference

A personal second-brain productivity app that runs entirely on localhost. Organizes work through typed cards inside workspaces, with AI assistance, calendar integration, and a scratch pad.

---

## Navigation

The top tab bar is the primary navigation surface.

| Tab | Route | Description |
|-----|-------|-------------|
| Home | `/` | Dashboard with schedule, active work, and clipboard |
| Calendar | `/calendar` | Embedded Google Calendar view |
| Academic / Personal / Office | `/category/:id` | Category-scoped view of all cards across workspaces |
| Workspace tabs | `/workspace/:id` | Individual workspace kanban board |

Each category group (Academic, Personal, Office) shows its child workspaces inline in the tab bar. Clicking the category name goes to the category view; clicking a workspace name goes directly to that kanban board.

---

## Home Dashboard

Three-panel layout.

### Schedule Panel (left)
- Hourly grid from 7am to 9pm
- Current hour highlighted with an indigo progress bar showing how far through the hour you are
- All-day events shown in a banner above the grid
- Events color-coded using Google Calendar's 11 color IDs mapped to Tailwind colors
- Connects to Google Calendar via OAuth — shows a connect link in the footer when not connected
- Disconnect button in header when connected
- Polls for new events every 5 minutes

### Active Work Panel (center)
- Aggregates all cards in the **ongoing** state across every workspace
- Also shows cards completed **today** (done + today's completion_date)
- Filter buttons at the bottom: All / Academic / Personal / Office
- Checkbox toggles state between pending ↔ done directly from the dashboard
- Animated transitions when checking/unchecking tasks
- Shimmer loading skeleton while fetching

### Clipboard / Scratch Pad (right)
- Free-form text area that auto-saves with a 900ms debounce
- Persists the last clipboard entry on reload
- Word count shown in the footer
- "Saved" indicator appears after auto-save

---

## Workspaces

Workspaces are the primary organizational unit. Each belongs to a category (Academic, Personal, Office) and has its own kanban board.

### Creating workspaces
- Click the **+** button inside any category group in the tab bar — type a name and press Enter
- Or use the **Spaces editor** (grid icon, top-right) to manage all workspaces in one panel

### Workspace settings
- **Color** — pick from 9 colors (violet, indigo, blue, cyan, emerald, rose, orange, amber, slate) via right-click / settings popover on a tab
- **Category** — reassign to a different category from the same popover

### Spaces editor
The grid icon top-right opens a full panel showing all categories and their workspaces. You can:
- Change category colors
- Change workspace colors
- Delete workspaces
- Create new workspaces inside any category

---

## Kanban Board

Each workspace has a three-column kanban board.

| Column | State | Color |
|--------|-------|-------|
| Pending | `pending` | Amber |
| In Progress | `ongoing` | Blue |
| Done | `done` | Emerald |

- **Drag and drop** — drag any card to a different column. Uses `@dnd-kit` with a 6px activation threshold to prevent accidental drags.
- **Drag overlay** — a rotated ghost card follows the cursor while dragging.
- Cards update state immediately on drop (optimistic), with the API call running in the background.

### Bottom filter bar
A filter bar sits at the bottom of every workspace. Only types with at least one card appear as buttons.

| Type | Color |
|------|-------|
| Tasks | Indigo |
| Notes | Emerald |
| Videos | Rose |
| Snippets | Amber |
| Links | Cyan |
| Files | Slate |

Each button shows a count. Clicking a button filters the board to that type only. Clicking the active button or "Clear" removes the filter.

---

## Card Types

Six card types, each with distinct visual design and metadata.

### Task
- Compact checkbox + text layout
- Tight padding — height matches text content only
- Checkbox fills with a checkmark when state is `done`, text gets a strikethrough
- Tracks `creation_date` and `completion_date` in metadata
- Completion date is set automatically when moved to done; cleared when moved back

### Note
- Larger card with a heading (first line of content) in bold
- Remaining lines shown as a smaller muted preview (up to 120 chars)
- Opens in a full-screen **split-pane markdown editor** instead of the card modal (see Note Editor below)
- Note body stored as a separate `.md` file on disk

### Video
- Thumbnail image flush to the top of the card (no top padding)
- Title and author below the thumbnail
- YouTube oEmbed metadata (title, author, thumbnail) is fetched **automatically** when you paste a YouTube URL during creation — no API key needed
- Falls back gracefully if fetch fails

### Snippet
- Code content + language badge (e.g. `python`, `js`)

### Link
- Title + extracted domain name (e.g. `github.com`)

### File
- Filename + any stored metadata

### Common fields
All cards share:
- **State**: pending / ongoing / done
- **Time label**: "today", "1d ago", "Nd ago" based on `updated_at`
- **Type accent**: left border color per type
- **Type badge**: pill label top-left (except tasks)

---

## Card Modal

Opens when you click any non-note card, or the **New Card** button.

- **Type selector** — 6 types with color-coded icons
- **Content** — main text field
- **Conditional fields**:
  - URL field for video and link cards
  - Language field for snippet cards
- **State selector** — only shown when editing an existing card
- **Delete button** — shown when editing (removes the card and any associated note file)
- Gradient header stripe matches the selected card type color

---

## Note Editor

Full-screen overlay with two panes side by side.

- **Left pane** — raw markdown textarea
- **Right pane** — live rendered preview using `react-markdown` with GFM support (tables, checkboxes, strikethrough)
- **Cmd+S / Ctrl+S** — save shortcut
- **Unsaved indicator** — appears when content has changed but not yet saved
- Content is loaded from and saved to a dedicated endpoint (`/api/cards/:contextId/:cardId/note`), stored as a `.md` file

---

## Category View

Accessed by clicking a category name (Academic / Personal / Office) in the tab bar.

- Shows **all cards across all workspaces** in that category
- Kanban grid with the same three columns
- Each card has a small colored dot indicating which workspace it belongs to
- Card editing works the same as in workspaces — click to open modal or note editor

---

## AI Command Bar

**Cmd+K** (or Ctrl+K) opens a command bar overlay. Escape closes it.

### Chat mode
Type anything without a `/` prefix to start a free-form multi-turn conversation with the AI. The current workspace's cards are injected into the system prompt for context.

### Slash commands
Type `/` to see an autocomplete list. Arrow keys to navigate, Tab or Enter to select.

| Command | What it does |
|---------|-------------|
| `/task [text]` | Creates a task card in the current workspace |
| `/note [text]` | Creates a note card + empty `.md` file |
| `/video [url]` | Creates a video card and fetches YouTube metadata |
| `/snippet [text]` | Creates a snippet card |
| `/link [url]` | Creates a link card |
| `/find [query]` | AI-powered search across all cards in the workspace |
| `/done [text]` | Fuzzy-matches card titles and marks the best match as done. Returns candidates if ambiguous. |
| `/clip [text]` | Saves text to the clipboard |
| `/summarize` | AI generates a 3–5 bullet summary of the current workspace |
| `/stale` | Lists cards that haven't been touched in a while (ongoing 5+ days, pending 14+ days) |

After card-creating commands, the workspace board refreshes automatically via a `personal-os:data-changed` browser event.

### AI providers
The AI layer is adapter-based — swap providers by changing `AI_PROVIDER` in `.env`.

| Provider | Env var | Default model |
|----------|---------|---------------|
| `gemini` | `GEMINI_API_KEY` | `gemini-2.0-flash` |
| `groq` | `GROQ_API_KEY` | `llama-3.3-70b-versatile` |
| `grok` | `GROK_API_KEY` | `grok-beta` |

---

## Calendar Integration

### Schedule panel (home)
The left panel on the home dashboard shows today's events fetched from Google Calendar API. Requires Google OAuth credentials in `.env`.

### Calendar tab
The Calendar tab shows an embedded Google Calendar iframe. Google blocks embedding of the main calendar URL — you need the special embed URL:

```
https://calendar.google.com/calendar/embed?src=YOUR_EMAIL&ctz=YOUR_TIMEZONE
```

Get this from: Google Calendar → Settings → [your calendar] → Integrate calendar → Embed code.

Click **Set embed URL** in the tab to paste it. The URL is stored in `localStorage`.

### OAuth flow (for schedule panel)
1. Add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` to `.env`
2. Click "Connect Google Calendar" in the schedule panel footer
3. Complete OAuth in the popup
4. Events appear automatically; panel polls every 5 minutes
5. Disconnect via the button in the schedule panel header

---

## Data Storage

All data lives in `backend/data/` as plain files — no database.

| File/folder | Contents |
|-------------|----------|
| `data/contexts/*.json` | One JSON file per workspace, contains all cards |
| `data/notes/*.md` | One markdown file per note card |
| `data/clipboard.json` | All clipboard entries |
| `data/meta.json` | Workspace index, last opened, calendar tokens |

### Workspace file structure
```json
{
  "id": "ml-research",
  "name": "ML Research",
  "category": "academic",
  "color": "#6366f1",
  "created_at": "...",
  "cards": [...]
}
```

### Card structure
```json
{
  "id": "uuid",
  "type": "task | note | video | snippet | link | file",
  "content": "...",
  "state": "pending | ongoing | done",
  "created_at": "...",
  "updated_at": "...",
  "meta": {}
}
```

Type-specific `meta` fields:
- **task**: `creation_date`, `completion_date`
- **note**: `filename`
- **video**: `url`, `title`, `author`, `thumbnail_url`
- **snippet**: `language`
- **link**: `url`
- **file**: `filename`, `size`

---

## Theme

- Dark mode by default
- Toggle via the sun/moon icon top-right
- Preference persisted in `localStorage`
- Built with Tailwind CSS v4 + custom `.surface`, `.surface-raised`, `.surface-overlay` glass classes
- Backdrop blur effects throughout

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+K` / `Ctrl+K` | Open / close command bar |
| `Escape` | Close modal / command bar / note editor |
| `Cmd+S` / `Ctrl+S` | Save note (inside note editor) |
| `↑ / ↓` | Navigate slash command autocomplete |
| `Tab` / `Enter` | Accept autocomplete suggestion |

---

## API Reference

### Contexts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/contexts` | List all workspaces with card counts |
| POST | `/api/contexts` | Create workspace `{name, category}` |
| GET | `/api/contexts/:id` | Full workspace + cards |
| PUT | `/api/contexts/:id` | Update `{name, color, category}` |
| DELETE | `/api/contexts/:id` | Delete workspace |
| PUT | `/api/contexts/meta/last-opened` | Set last opened `{id}` |

### Cards
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/cards/:contextId` | Create card |
| GET | `/api/cards/:contextId/:cardId` | Get card |
| PUT | `/api/cards/:contextId/:cardId` | Update card |
| PUT | `/api/cards/:contextId/:cardId/state` | Move card `{state}` |
| DELETE | `/api/cards/:contextId/:cardId` | Delete card |
| GET | `/api/cards/:contextId/:cardId/note` | Read note markdown |
| PUT | `/api/cards/:contextId/:cardId/note` | Save note markdown |

### Clipboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/clipboard` | All entries |
| POST | `/api/clipboard` | Add entry `{text}` |
| DELETE | `/api/clipboard/:entryId` | Delete entry |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/chat` | Multi-turn chat `{messages, contextId?}` |
| POST | `/api/ai/command` | Slash command `{command, args, contextId}` |

### Calendar
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/calendar/auth-url` | Get OAuth consent URL |
| GET | `/api/calendar/oauth/callback` | OAuth redirect handler |
| GET | `/api/calendar/events` | Today's events `?date=YYYY-MM-DD` |
| GET | `/api/calendar/status` | Connection status |
| POST | `/api/calendar/disconnect` | Disconnect |

---

## Environment Variables

```env
PORT=4000
FRONTEND_URL=http://localhost:5173

# AI
AI_PROVIDER=gemini          # gemini | groq | grok
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.0-flash

# Calendar
CALENDAR_PROVIDER=google
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:4000/api/calendar/oauth/callback

# Video
VIDEO_PROVIDER=youtube
```
