# Personal OS — Implementation Plan

## Context

You get overwhelmed managing tasks, notes, videos, and clips across many projects. This app is a localhost "second brain" — one interface to organize everything. Cards (typed items) live inside Contexts (workspaces), move through states (pending/ongoing/done), and an AI command bar (Cmd+K) is the fast-capture layer.

**Key architectural constraint:** All third-party integrations (AI provider, calendar, video metadata) sit behind abstract adapter interfaces. Swapping Google Calendar for Outlook, or Grok for Claude, means writing a new adapter — zero changes to routes, frontend, or business logic.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Storage | JSON files + .md notes |
| AI | Grok API (swappable via adapter) |
| Calendar | Google Calendar (swappable via adapter) |
| Video metadata | YouTube oEmbed (swappable via adapter) |
| DnD | @dnd-kit |
| Theme | Dark/light with toggle |
| Config | .env + dotenv |

---

## Integration Adapter Architecture

All third-party services follow the same pattern: an abstract interface in `backend/integrations/<service>/`, with concrete adapters as separate files.

```
backend/integrations/
├── ai/
│   ├── index.js           ← exports active adapter (reads from .env)
│   ├── base.js            ← abstract interface: chat(messages, opts) → string
│   ├── grok.js            ← implements base using x.ai OpenAI-compat API
│   └── openai.js          ← future: same interface, different provider
├── calendar/
│   ├── index.js           ← exports active adapter
│   ├── base.js            ← abstract interface: getAuthUrl(), handleCallback(), getEvents(), getStatus(), disconnect()
│   └── google.js          ← implements base using googleapis
├── video/
│   ├── index.js           ← exports active adapter
│   ├── base.js            ← abstract interface: fetchMetadata(url) → { title, author, thumbnail_url }
│   └── youtube.js         ← implements base using oEmbed
```

**How swapping works:** Change `AI_PROVIDER=grok` / `CALENDAR_PROVIDER=google` / `VIDEO_PROVIDER=youtube` in `.env`. The `index.js` in each folder reads this and exports the right adapter. Routes only ever `require('../integrations/ai')` — they never import a specific provider.

Routes call adapter methods. Adapters handle all provider-specific logic. This is the hard boundary.

---

## File Structure

```
CachedThreads/
├── .env
├── .gitignore
├── package.json                 (npm workspaces: backend, frontend)
├── backend/
│   ├── package.json
│   ├── server.js
│   ├── routes/
│   │   ├── contexts.js
│   │   ├── cards.js
│   │   ├── clipboard.js
│   │   ├── calendar.js
│   │   └── ai.js
│   ├── services/
│   │   └── storage.js           (all file I/O abstracted here)
│   ├── integrations/
│   │   ├── ai/
│   │   │   ├── index.js
│   │   │   ├── base.js
│   │   │   └── grok.js
│   │   ├── calendar/
│   │   │   ├── index.js
│   │   │   ├── base.js
│   │   │   └── google.js
│   │   └── video/
│   │       ├── index.js
│   │       ├── base.js
│   │       └── youtube.js
│   ├── ai/
│   │   └── prompts/
│   │       ├── system.txt
│   │       ├── summarize.txt
│   │       └── find.txt
│   └── data/
│       ├── contexts/            (*.json, one per workspace)
│       ├── notes/               (*.md, one per note card)
│       ├── clipboard.json
│       └── meta.json
├── frontend/
│   ├── vite.config.js
│   ├── package.json
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       ├── api/
│       │   └── client.js        (thin fetch wrapper)
│       ├── hooks/
│       │   ├── useContexts.js
│       │   ├── useCards.js
│       │   ├── useClipboard.js
│       │   ├── useCalendar.js
│       │   └── useTheme.js
│       ├── context/
│       │   └── ThemeContext.jsx
│       ├── components/
│       │   ├── Layout/
│       │   │   ├── Sidebar.jsx
│       │   │   └── Header.jsx
│       │   ├── Dashboard/
│       │   │   ├── Dashboard.jsx
│       │   │   ├── TodoList.jsx
│       │   │   ├── CalendarPanel.jsx
│       │   │   ├── ClipboardPanel.jsx
│       │   │   └── WorkspaceLinks.jsx
│       │   ├── Workspace/
│       │   │   ├── Workspace.jsx
│       │   │   ├── KanbanBoard.jsx
│       │   │   ├── KanbanColumn.jsx
│       │   │   └── KanbanCard.jsx
│       │   ├── Cards/
│       │   │   ├── CardModal.jsx
│       │   │   ├── TaskCard.jsx
│       │   │   ├── NoteCard.jsx
│       │   │   ├── VideoCard.jsx
│       │   │   ├── SnippetCard.jsx
│       │   │   ├── LinkCard.jsx
│       │   │   └── FileCard.jsx
│       │   ├── CommandBar/
│       │   │   ├── CommandBar.jsx
│       │   │   ├── ChatMessage.jsx
│       │   │   └── SlashCommands.js
│       │   ├── Notes/
│       │   │   └── MarkdownEditor.jsx
│       │   └── common/
│       │       ├── ThemeToggle.jsx
│       │       ├── Badge.jsx
│       │       └── AttentionDot.jsx
│       └── utils/
│           ├── dates.js
│           └── stale.js
```

---

## Data Model

**Context** (one JSON file per workspace — `data/contexts/{id}.json`):
```json
{ "id": "ocr-pipeline", "name": "OCR Pipeline", "created_at": "...", "cards": [] }
```

**Card** (inside a context's cards array):
```json
{
  "id": "uuid", "type": "task|note|video|snippet|link|file",
  "content": "...", "state": "pending|ongoing|done",
  "created_at": "...", "updated_at": "...",
  "meta": {}
}
```
Type-specific meta: video → `{url, watch_state, thumbnail_url, title, author}`, snippet → `{language}`, link → `{url, title}`, note → `{filename}`, file → `{filename, size}`

**Clipboard** (`data/clipboard.json`): `{ "entries": [{ "id", "content", "created_at" }] }`

**meta.json**: `{ "contexts": [...], "lastOpened": "...", "calendarTokens": {} }`

---

## Phase 1 — Skeleton (Backend + Frontend together)

### Backend

1. **`backend/services/storage.js`** — All file I/O abstracted here
   - `ensureDataDirs()` — create data/, data/contexts/, data/notes/ if missing
   - `readMeta()` / `writeMeta(meta)` — read/write meta.json
   - `readContext(id)` / `writeContext(ctx)` / `deleteContextFile(id)`
   - `readClipboard()` / `writeClipboard(data)`
   - `readNote(filename)` / `writeNote(filename, content)` / `deleteNote(filename)`
   - All use `fs.promises`, `JSON.stringify(data, null, 2)` for readable files

2. **`backend/server.js`** — Express entry point
   - Load .env from `../.env`, setup cors + json middleware
   - Mount routes: `/api/contexts`, `/api/cards`, `/api/clipboard`
   - Call `ensureDataDirs()` before listen on PORT (default 4000)

3. **`backend/routes/contexts.js`** — Context CRUD
   - `GET /api/contexts` — list all with card count summaries
   - `POST /api/contexts` — create (accept `{name}`, generate slug id)
   - `GET /api/contexts/:id` — full context with cards
   - `PUT /api/contexts/:id` — update name
   - `DELETE /api/contexts/:id` — remove file + update meta.json
   - `PUT /api/contexts/meta/last-opened` — update lastOpened

4. **`backend/routes/cards.js`** — Card CRUD
   - `POST /api/cards/:contextId` — create card (generate UUID, state=pending, timestamps)
   - `GET /api/cards/:contextId/:cardId` — get single card
   - `PUT /api/cards/:contextId/:cardId` — partial update, bump updated_at
   - `PUT /api/cards/:contextId/:cardId/state` — change state (used by kanban drag)
   - `DELETE /api/cards/:contextId/:cardId` — remove card (delete .md if note type)

5. **`backend/routes/clipboard.js`** — Clipboard
   - `GET /api/clipboard` — return all entries
   - `POST /api/clipboard` — append entry with UUID + timestamp
   - `DELETE /api/clipboard/:entryId` — remove entry

### Frontend

6. **Project init** — `npm create vite@latest frontend -- --template react`, install tailwindcss + @tailwindcss/vite, configure vite proxy (`/api` → localhost:4000)

7. **`frontend/src/context/ThemeContext.jsx`** — React context for dark/light theme, reads/writes localStorage, toggles `dark` class on `<html>`

8. **`frontend/src/api/client.js`** — Thin fetch wrapper: `api(path, opts)` with convenience methods `.get()`, `.post()`, `.put()`, `.del()`. Prepends `/api`, handles JSON, throws on errors.

9. **`frontend/src/hooks/useContexts.js`** — contexts list, createContext, deleteContext, setLastOpened

10. **`frontend/src/hooks/useCards.js`** — takes contextId, returns context+cards, createCard, updateCard, moveCard, deleteCard

11. **`frontend/src/App.jsx`** — react-router-dom routes: `/` → Dashboard, `/workspace/:contextId` → Workspace. Wrapped in ThemeProvider.

12. **`frontend/src/components/Layout/Sidebar.jsx`** — Lists contexts as nav links, "New Workspace" button, ThemeToggle at bottom

13. **`frontend/src/components/Layout/Header.jsx`** — Shows current page title

14. **`frontend/src/components/Dashboard/Dashboard.jsx`** — Grid layout: WorkspaceLinks (cards linking to each workspace with card counts), TodoList (aggregates ongoing cards across all contexts), ClipboardPanel placeholder

15. **`frontend/src/components/Workspace/Workspace.jsx`** — Three columns (pending/ongoing/done), cards as simple styled divs (no DnD yet), "New Card" button opens CardModal form

16. **`frontend/src/components/Cards/CardModal.jsx`** — Modal with form to create/edit cards (type dropdown, content textarea, state dropdown)

### Phase 1 Verification
- Create a context via sidebar → JSON file appears in `backend/data/contexts/`
- Create cards, see them in columns, edit via modal, change state
- Dashboard shows workspace links with counts + ongoing tasks in TodoList
- Dark/light toggle works
- Delete a card, delete a context

---

## Phase 2 — Core Interactions

### Dependencies
```bash
cd frontend && npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities react-markdown remark-gfm react-syntax-highlighter
```

### Tasks

1. **Kanban DnD** — `KanbanBoard.jsx` wraps board in `<DndContext>` with `closestCorners` collision detection. `KanbanColumn.jsx` uses `useDroppable`. `KanbanCard.jsx` uses `useSortable`. On `onDragEnd`, call `moveCard(cardId, newState)` which PUTs to `/api/cards/:contextId/:cardId/state`.

2. **Typed card rendering** — Each card type gets its own component rendered inside KanbanCard based on `card.type`:
   - TaskCard: content + checkbox indicator + relative time
   - NoteCard: first-line title + truncated preview + edit icon
   - VideoCard: thumbnail + title + watch state badge + play icon
   - SnippetCard: language badge + syntax-highlighted preview (5 lines)
   - LinkCard: title/URL + external link icon
   - FileCard: filename + type icon

3. **YouTube metadata** — `backend/integrations/video/youtube.js`: use oEmbed API (`https://www.youtube.com/oembed?url=...&format=json`), no API key needed. Called during card creation when `type === 'video'`. Falls back to manual if fetch fails. Route in `cards.js` calls `require('../integrations/video').fetchMetadata(url)`.

4. **Markdown editor** — `Notes/MarkdownEditor.jsx`: side-by-side textarea + ReactMarkdown live preview. New backend routes on cards.js: `GET/PUT /api/cards/:contextId/:cardId/note` to read/write the .md file.

5. **Clipboard panel** — `Dashboard/ClipboardPanel.jsx`: entries in reverse chronological order, text input to add, copy + delete buttons per entry. `hooks/useClipboard.js` manages state.

### Phase 2 Verification
- Drag card between columns → state updates in backend JSON
- Create video card with YouTube URL → thumbnail + title auto-populated
- Create note card → markdown editor opens, type + preview, save creates .md file
- Snippet card shows syntax highlighting
- Clipboard: add, copy, delete entries

---

## Phase 3 — AI Layer

### Integration adapter setup

1. **`backend/integrations/ai/base.js`** — Abstract interface:
   ```js
   class AIProvider {
     async chat(messages, opts) { throw new Error('not implemented'); }
   }
   ```

2. **`backend/integrations/ai/grok.js`** — Implements chat() using x.ai OpenAI-compatible endpoint (`https://api.x.ai/v1/chat/completions`). Reads `GROK_API_KEY` and `GROK_MODEL` from env.

3. **`backend/integrations/ai/index.js`** — Reads `AI_PROVIDER` from env, exports the matching adapter.

### Backend

4. **`backend/ai/prompts/*.txt`** — Narrow task-specific prompts:
   - `system.txt`: base personality (concise, ask one follow-up if ambiguous)
   - `summarize.txt`: summarize workspace data template
   - `find.txt`: search cards template

5. **`backend/routes/ai.js`** — Two endpoints:
   - `POST /api/ai/chat` — free-form chat, accepts `{messages, contextId?}`, injects context data into system prompt, returns AI response. Supports multi-turn (frontend sends full history).
   - `POST /api/ai/command` — accepts `{command, args, contextId}`, dispatches to command handler, returns structured response.

6. **Command handlers** (inside ai.js or a separate commands module):
   - `/task [text]` → create task card in context
   - `/note [text]` → create note card + empty .md file
   - `/video [url]` → create video card, fetch metadata via video adapter
   - `/find [query]` → AI-powered search across cards
   - `/done [text]` → fuzzy-match against card titles, mark done. If ambiguous, return candidates for follow-up.
   - `/clip [text]` → append to clipboard
   - `/summarize` → AI summary of workspace
   - `/stale` → compute stale cards (ongoing 5+ days, pending 14+ days)

### Frontend

7. **`CommandBar/CommandBar.jsx`** — Full-screen overlay on Cmd+K (Ctrl+K on non-Mac):
   - Chat message list + input at bottom
   - If input starts with `/`, parse command, POST to `/api/ai/command`
   - Otherwise POST to `/api/ai/chat` with full message history
   - Slash command autocomplete dropdown when typing `/`
   - Close on Escape, messages cleared on close

8. **`CommandBar/ChatMessage.jsx`** — Message bubble, different styling user/assistant, markdown rendering in assistant messages

9. **`CommandBar/SlashCommands.js`** — Array of `{command, description, usage}` for autocomplete

10. **Keyboard shortcut** — Register Cmd+K listener in App.jsx

### Phase 3 Verification
- Cmd+K opens overlay, Escape closes
- `/task Write tests` → task card created, confirmation in chat
- `/video <youtube-url>` → video card with metadata
- `/summarize` → AI returns workspace digest
- Free-form "What should I work on?" → AI responds with context
- `/done <partial match>` → handles ambiguity with follow-up

---

## Phase 4 — Calendar

### Integration adapter setup

1. **`backend/integrations/calendar/base.js`** — Abstract interface:
   ```js
   class CalendarProvider {
     getAuthUrl() { throw new Error('not implemented'); }
     async handleCallback(code) { throw new Error('not implemented'); }
     async getEvents(timeMin, timeMax) { throw new Error('not implemented'); }
     async getStatus() { throw new Error('not implemented'); }
     async disconnect() { throw new Error('not implemented'); }
   }
   ```

2. **`backend/integrations/calendar/google.js`** — Implements using `googleapis` npm package. OAuth2 flow, stores tokens in meta.json, auto-refreshes.

3. **`backend/integrations/calendar/index.js`** — Reads `CALENDAR_PROVIDER` from env, exports matching adapter.

### Backend

4. **`backend/routes/calendar.js`** — All routes delegate to the calendar adapter:
   - `GET /api/calendar/auth-url` → adapter.getAuthUrl()
   - `GET /api/calendar/oauth/callback` → adapter.handleCallback(code)
   - `GET /api/calendar/events` → adapter.getEvents() (next 7 days)
   - `GET /api/calendar/status` → adapter.getStatus()
   - `POST /api/calendar/disconnect` → adapter.disconnect()

### Frontend

5. **`hooks/useCalendar.js`** — events, isConnected, connectUrl, disconnect, refresh. Polls every 5 minutes when connected.

6. **`Dashboard/CalendarPanel.jsx`** — If not connected: "Connect Calendar" button. If connected: timeline of today's + upcoming events grouped by day, click opens event link.

### Phase 4 Verification
- Dashboard shows "Connect Calendar" button
- OAuth flow → redirected back → events appear
- Events auto-refresh
- Disconnect removes connection

---

## Phase 5 — Polish

1. **Attention layer** — `utils/stale.js`: `getAttentionLevel(card)` returns `'warning'` (ongoing, untouched 5+ days) or `'stale'` (pending, 14+ days). `common/AttentionDot.jsx`: amber pulsing dot or red stale indicator. Rendered in KanbanCard top-right.

2. **Keyboard navigation** — Arrow keys between cards, Enter to open modal, `n` for new card, `1/2/3` to switch columns. Tab between dashboard panels.

3. **Visual polish** — Card type left-border colors (task=indigo, note=emerald, video=red, snippet=amber, link=blue, file=gray). Transitions on interactive elements. Empty states with helpful messages. Loading skeleton components.

4. **Toast notifications** — Install `react-hot-toast` for error/success feedback.

5. **Optimistic updates** — DnD updates UI immediately, reverts on API error.

### Phase 5 Verification
- Amber dots on stale ongoing cards, red indicators on stale pending
- Keyboard nav works across kanban board
- Both themes look polished
- Empty states render correctly
- Toasts appear on actions

---

## npm Packages

**Backend:** express, cors, dotenv, uuid, googleapis (Phase 4), nodemon (dev)

**Frontend:** react-router-dom, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, react-markdown, remark-gfm, react-syntax-highlighter, react-hot-toast, tailwindcss, @tailwindcss/vite

**Root:** concurrently (dev) — run both servers with `npm run dev`

---

## Dev Workflow

```bash
# Start both servers
npm run dev

# Or individually
cd backend && npm run dev    # :4000
cd frontend && npm run dev   # :5173 (proxies /api → :4000)
```
