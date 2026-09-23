# Cash Stage Studio — backend + demo console

A working backend and browser-based demo frontend that implement the flows
in the Studio QA test plan (project CRUD, recording, import, playback,
draft autosave, export/share, offline-then-sync). Zero external
dependencies — pure Node.js built-ins — so it runs anywhere with no
`npm install` step.

## Run it

```
node server.js
```

Then open **http://localhost:8787** in a browser (Chrome/Edge recommended
for microphone recording support). Allow microphone access when prompted
to test the Record button.

## What's inside

- `server.js` — HTTP API + static file server (see routes below)
- `public/` — demo "studio console" UI: project list, transport controls
  (Record/Stop/Play/Pause/Import/Undo/Redo), takes list, Save
  draft/Export/Share/Delete, and a live **activity log** panel that traces
  every button press and API call — useful for the UI dead-button audit
  in the test plan.
- `db.json` — created on first run; flat-file store for project/recording/
  export metadata (no SQLite/Postgres setup needed for this scaffold).
- `uploads/`, `exports/` — audio blobs land here.

## API

| Method | Path                              | Test-plan case(s)        |
|--------|------------------------------------|---------------------------|
| GET    | /api/health                        | ST-001                    |
| GET    | /api/projects                      | ST-001, ST-002            |
| POST   | /api/projects                      | ST-003, ST-004            |
| GET    | /api/projects/:id                  | —                          |
| PUT    | /api/projects/:id                  | ST-005, ST-019, ST-020    |
| DELETE | /api/projects/:id                  | ST-006                    |
| POST   | /api/projects/:id/recordings       | ST-007, ST-013, ST-014, ST-015 |
| GET    | /api/recordings/:id/file           | ST-010, ST-011, ST-012    |
| DELETE | /api/recordings/:id                | —                          |
| POST   | /api/projects/:id/export           | ST-022                    |
| GET    | /api/exports/:id/file              | ST-023                    |
| GET    | /api/sync                          | ST-027, ST-029             |

## Notes / what's intentionally out of scope

- **Export is a scaffold, not a real mixdown.** It packages the most
  recent take as the "export" so the end-to-end pipeline (export → file →
  share) is exercised. Wire in a real audio encoder/mixer for production.
- **Trim/Undo/Redo (ST-016/017/018)** are implemented at the demo-UI level
  (title-field history) as a stand-in for full waveform editing — swap in
  your real editing engine's state and call the same Save-draft endpoint.
- **Storage is a JSON file**, not a database. Swap `loadDB/saveDB` in
  `server.js` for a real DB client when you're ready; the route logic
  doesn't need to change.
- **Offline save/sync (ST-028/029)** is demonstrated via a `localStorage`
  queue in `app.js` that flushes against `/api/sync` on reconnect.
