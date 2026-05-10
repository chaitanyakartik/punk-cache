# CachedThreads — Feature Reference

A personal second-brain productivity app that runs entirely on localhost. Organizes work through typed cards inside workspaces, with AI assistance, calendar integration, and a scratch pad.

---

## Navigation

The top tab bar is the primary navigation surface.

| Tab | Route | Description |
|-----|-------|-------------|
| Home | `/` | Dashboard with schedule, active work, clipboard, and today's tracker strip |
| Calendar | `/calendar` | Embedded Google Calendar view |
| Life | `/life` | Daily habit tracker and long-term goal tracker |
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

---

## Life Tab

Route `/life`. Two independent sections via sub-tabs — no data connection between them.

### Daily Tracker

**Storage:** `backend/data/tracker/YYYY-MM.json` — one file per month.

```json
{
  "month": "2025-05",
  "columns": [
    { "id": "wake", "label": "Waking up", "type": "time" },
    { "id": "gym", "label": "Gym", "type": "checkbox" },
    { "id": "college", "label": "College", "type": "number" }
  ],
  "rows": [
    { "date": "2025-05-10", "wake": "07:15", "gym": true, "college": 3 }
  ]
}
```

**Column types:** `time` (HH:MM text input), `checkbox` (boolean toggle), `number` (numeric input).

**Frontend:**
- Spreadsheet-style table — one row per calendar day of the month, all days always shown
- Today's row highlighted in indigo
- All edits auto-save on change with a 500ms debounce — no save button
- Previous / Next month arrows + "Today" shortcut at the top
- Navigating to a month with no file carries the column schema forward from the most recent month that has one (walks back up to 24 months)
- **Add Column** button — enter label and pick type, appends to schema and backfills `null` in all existing rows
- No delete anywhere in this section

**Current columns (as of May 2025):**

| Column | Type | Notes |
|--------|------|-------|
| Waking up | time | |
| Sleeping | time | |
| Reading | checkbox | |
| Yoga | checkbox | |
| Gym | checkbox | |
| Running | checkbox | |
| Meditation-M | checkbox | Morning session |
| Meditation-N | checkbox | Night session |
| College | number | Hours |
| Work | number | Hours |

**Suggested additions** (derived from workspace context):

| Column | Type | Reasoning |
|--------|------|-----------|
| Violin | number (minutes) | Violin workspace + goal — daily practice time |
| DSA | checkbox | Dedicated workspace, daily consistency matters |
| Screen time | number (hours) | Complements sleep/wake tracking |
| Calories | number | Fitness workspace, gym/running/yoga already tracked |
| Water | number (glasses) | Fitness context |

**API:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tracker/:yearMonth` | Get month data (creates if missing, carries schema) |
| PUT | `/api/tracker/:yearMonth/row` | Upsert a row `{ date, ...values }` |
| PUT | `/api/tracker/:yearMonth/columns` | Replace columns array (backfills rows) |

---

### Long Term Goal Tracker

**Storage:** `backend/data/goals.json`

```json
{
  "goals": [
    {
      "id": "uuid",
      "title": "Run 20km",
      "metric": "km",
      "target": 20,
      "deadline": "2025-09-01",
      "created_at": "...",
      "milestones": [
        { "id": "uuid", "label": "10km", "target": 10, "due": "2025-07-01", "hit": false }
      ],
      "log": [
        { "id": "uuid", "date": "2025-05-09", "value": 5, "note": "first long run" }
      ]
    }
  ]
}
```

**Frontend:**
- Goals displayed as cards in a 2–3 column grid
- Each card shows: title, best log value vs target, progress bar, deadline, next upcoming unhit milestone
- Progress bar color: **grey** if no imminent milestone, **amber** if next milestone due ≤ 14 days, **red** if overdue
- Clicking a card opens a detail view with:
  - Overview panel (best value, target, progress bar)
  - Milestone timeline — hit milestones in emerald, next in amber, future in grey
  - Log history in reverse chronological order
  - **Log Session** form — numeric value + optional note; auto-marks any milestone as `hit: true` if value ≥ milestone target
  - **Add Milestone** button — appends to an existing goal; auto-marks hit if current log already clears it
- **New Goal** form — title, metric (free text), target (number), deadline (date), inline milestone builder
- No delete anywhere in this section

**Current goals (as of May 2025):**

| Goal | Metric | Target | Deadline |
|------|--------|--------|----------|
| Run 20km | km | 20 | 2025-09-01 |
| Finish a book | pages | 300 | 2025-06-10 |
| Learn violin | hours | 30 | 2025-06-10 |
| Learn swimming | sessions | 20 | 2025-06-10 |

**API:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/goals` | All goals |
| POST | `/api/goals` | Create goal `{ title, metric, target, deadline, milestones[] }` |
| POST | `/api/goals/:id/log` | Append log entry `{ value, note }`, auto-marks milestones |
| POST | `/api/goals/:id/milestone` | Add milestone to existing goal `{ label, target, due }` |

---

## Today's Tracker Strip

A thin strip at the bottom of the Home dashboard that surfaces today's daily tracker row without leaving the page.

- Fetches the current month's tracker data on mount
- Renders all columns inline: label + input side by side, separated by subtle dividers
- Checkboxes toggle instantly (no debounce), time and number inputs auto-save with 500ms debounce
- Invisible if no tracker columns exist (no empty bar)
- Changes sync to the same file as the Life tab — editing here is reflected there immediately on refresh
