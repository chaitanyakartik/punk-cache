# Data Design

This document describes how Personal OS stores and structures all of its data.

---

## Storage Philosophy

No database. Everything lives as plain files on disk inside `backend/data/`. The tradeoff is simplicity and portability — files are human-readable, git-trackable, and require no setup. The downside is no queries, no indexing, and no transactions; reads and writes are full file replacements each time.

All file I/O is centralized in `backend/services/storage.js`. Nothing else touches the filesystem directly.

---

## Directory Layout

```
backend/data/
├── meta.json              ← global app state (context registry, last opened, calendar tokens)
├── clipboard.json         ← scratchpad entries
├── contexts/
│   ├── ml-research.json   ← one file per workspace, contains all cards
│   ├── ocr-pipeline.json
│   └── music-production.json
└── notes/
    └── <card-uuid>.md     ← one .md file per note card, keyed by card id
```

---

## Files

### `meta.json`

Global registry and app-level state. Read on every context list request.

```json
{
  "contexts": ["ml-research", "ocr-pipeline", "music-production"],
  "lastOpened": "ocr-pipeline",
  "calendarTokens": null
}
```

| Field | Type | Purpose |
|---|---|---|
| `contexts` | `string[]` | Ordered list of context IDs. Controls tab order in the UI. |
| `lastOpened` | `string \| null` | ID of the last workspace the user had open. Used to restore state on reload. |
| `calendarTokens` | `object \| null` | OAuth tokens for the calendar integration (Phase 4). `null` until connected. |

Context files are the source of truth for workspace data. `meta.json` only holds the ID list — it does not duplicate names or card counts.

---

### `contexts/<id>.json`

One file per workspace. Contains the workspace's metadata and all of its cards inline. The filename is the context's ID (a URL-safe slug derived from the name).

```json
{
  "id": "ml-research",
  "name": "ML Research",
  "created_at": "2026-05-09T10:15:08.881Z",
  "cards": [ ... ]
}
```

| Field | Type | Purpose |
|---|---|---|
| `id` | `string` | Slugified name (e.g. `"ML Research"` → `"ml-research"`). Used in URLs and as filename. Unique, with a numeric suffix if there's a collision. |
| `name` | `string` | Display name shown in tabs and UI. |
| `color` | `string \| undefined` | Optional accent color for the workspace (not yet used in UI). |
| `created_at` | `ISO 8601` | Creation timestamp. |
| `cards` | `Card[]` | All cards belonging to this workspace, in insertion order. |

Reading a workspace means reading this one file. Writing a card update means rewriting this entire file.

---

### Cards

Cards live inside the `cards` array of their context file. They are never stored in a separate file (except note cards, which get a companion `.md` file — see below).

#### Base shape (all card types)

```json
{
  "id": "7f15e8a1-199e-4b75-a43c-aaaf4efac0e1",
  "type": "task",
  "content": "Set up surya model",
  "state": "pending",
  "created_at": "2026-05-09T10:15:15.529Z",
  "updated_at": "2026-05-09T10:15:15.529Z",
  "meta": {}
}
```

| Field | Type | Values |
|---|---|---|
| `id` | `string` | UUID v4, generated at creation. |
| `type` | `string` | `"task"`, `"note"`, `"video"`, `"snippet"`, `"link"`, `"file"` |
| `content` | `string` | Primary display text. For notes, this is the first line of the `.md` file (updated on save). |
| `state` | `string` | `"pending"`, `"ongoing"`, `"done"` — determines which kanban column the card lives in. |
| `created_at` | `ISO 8601` | Set once at creation, never changes. |
| `updated_at` | `ISO 8601` | Bumped on every content or state change. Used for stale detection. |
| `meta` | `object` | Type-specific extra fields. Empty `{}` for types that don't need it. |

#### State transitions

State only changes through the dedicated `PUT /api/cards/:contextId/:cardId/state` route. General card updates (`PUT /api/cards/:contextId/:cardId`) explicitly strip the `state` field to prevent accidental overwrites.

#### Card types and their `meta`

**`task`** — a to-do item.
```json
{
  "meta": {
    "creation_date": "2026-05-09T10:15:15.529Z",
    "completion_date": null
  }
}
```
| Meta field | Purpose |
|---|---|
| `creation_date` | When the task was created. Set once at creation, never changes. |
| `completion_date` | Set to an ISO timestamp when state moves to `"done"`. Reset to `null` if the card is moved back to `"pending"` or `"ongoing"`. |

`content` is the task description.

---

**`note`** — a markdown document.
```json
{
  "meta": { "filename": "7f15e8a1-199e-4b75-a43c-aaaf4efac0e1.md" }
}
```
| Meta field | Purpose |
|---|---|
| `filename` | Name of the companion `.md` file in `data/notes/`. Always `<card-id>.md`. |

`content` on the card object stores the first line of the markdown (used as a title preview in the kanban). Full body lives in the `.md` file. On note save, both the `.md` file and `content` are updated together.

---

**`video`** — a video to watch (e.g. YouTube).
```json
{
  "meta": {
    "url": "https://youtube.com/watch?v=...",
    "title": "Attention Is All You Need",
    "author": "Yannic Kilcher",
    "thumbnail_url": "https://i.ytimg.com/vi/.../hqdefault.jpg",
    "watch_state": "unwatched"
  }
}
```
| Meta field | Purpose |
|---|---|
| `url` | Source URL. |
| `title` | Auto-fetched via YouTube oEmbed (Phase 2). Falls back to `content`. |
| `author` | Channel name from oEmbed. |
| `thumbnail_url` | Thumbnail from oEmbed. |
| `watch_state` | `"unwatched"`, `"watching"`, `"watched"`. Independent from kanban `state`. |

---

**`snippet`** — a code snippet.
```json
{
  "meta": { "language": "python" }
}
```
| Meta field | Purpose |
|---|---|
| `language` | Language identifier for syntax highlighting (e.g. `"python"`, `"typescript"`). |

`content` holds the code text.

---

**`link`** — a URL bookmark.
```json
{
  "meta": {
    "url": "https://example.com",
    "title": "Example Site"
  }
}
```
| Meta field | Purpose |
|---|---|
| `url` | The link target. |
| `title` | Optional fetched or manually set page title. |

---

**`file`** — a reference to a file.
```json
{
  "meta": {
    "filename": "report.pdf",
    "size": 204800
  }
}
```
| Meta field | Purpose |
|---|---|
| `filename` | Original filename. |
| `size` | File size in bytes. |

Note: file content is not stored in the app. This is a reference card — a pointer, not an upload.

---

### `notes/<card-id>.md`

Plain markdown files. One per note card. Named `<card-uuid>.md` so the name is stable and collision-free regardless of what the note is titled. The card's `meta.filename` field stores this name.

These are the only files in the system that store raw text rather than JSON. They are read and written directly via `GET /PUT /api/cards/:contextId/:cardId/note`.

When a note card is deleted, its `.md` file is also deleted (best-effort, errors silently swallowed).

---

### `clipboard.json`

The scratchpad. Stores a list of text entries.

```json
{
  "entries": [
    {
      "id": "241d8cf2-8e16-4d27-9988-4c1b20db9d38",
      "content": "some text the user typed...",
      "created_at": "2026-05-09T12:36:15.138Z"
    }
  ]
}
```

In the current UI, the clipboard is treated as a **single scratchpad** — when the user types in the textarea, the old entry is deleted and a new one is POSTed. So in practice there is usually at most one entry. The schema supports multiple entries for potential future use (history, named clips, etc.).

| Field | Type | Purpose |
|---|---|---|
| `id` | UUID v4 | Entry identifier, used for targeted deletion. |
| `content` | `string` | The raw text. |
| `created_at` | `ISO 8601` | When the entry was saved. |

---

## How Reads and Writes Work

| Operation | What happens on disk |
|---|---|
| List workspaces | Read `meta.json`, then read each `contexts/<id>.json` in parallel. |
| Open a workspace | Read `contexts/<id>.json`. All cards come with it. |
| Create a card | Read context file → push card → write context file back. |
| Update a card | Read context file → splice updated card → write back. |
| Change card state | Same as update, but through the dedicated state route. |
| Delete a card | Read context file → remove card → write back. Delete `.md` if note. |
| Create a workspace | Write new `contexts/<id>.json` → update `meta.json`. |
| Delete a workspace | Delete `contexts/<id>.json` → remove ID from `meta.json`. |
| Read/write a note | Direct read/write of `notes/<id>.md`. Card's `content` field updated separately. |
| Save clipboard | Delete old entry → POST new entry (both touch `clipboard.json`). |

All writes are full file replacements (`fs.writeFile`). There is no partial update or append — the entire file is serialized from memory each time. This is safe for a single-user localhost app but would not scale to concurrent writes.
