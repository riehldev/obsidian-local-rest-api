Return a live snapshot of the Obsidian workspace UI state — what tab is focused, what other tabs are open in the main area, where the cursor is, and which files were recently opened.

This is the preferred replacement for the older `/active/` GET endpoint when you need to know what the user is actually doing right now, rather than just reading the active file's content. Unlike `getActiveFile()`, this endpoint reports useful information even when the currently focused tab is not a file (terminal, settings, graph view, etc.).

### What's included

- **`focused`** — detail about the currently focused main-area leaf. `null` when no main-area leaves exist. When focused on a markdown file, includes `cursor` and, if a non-empty selection exists, `selection`. Preview-mode markdown views omit cursor info (there is no editor in preview mode).
- **`tabs`** — flat array of every leaf in the main area, with `viewType`, `path` (`null` for non-file views), and `isFocused`. Sidebar leaves (file explorer, outline, backlinks pane, etc.) are intentionally not included.
- **`recentFiles`** — vault-relative paths of up to 10 most recently opened files.
- **`mostRecentActiveFile`** — vault path of the most recently active file, with a robust fallback chain for "what file is the user on" regardless of current focus:
  1. Obsidian's `getActiveFile()` (the focused FileView, or its own in-memory most-recent tracker).
  2. The first FileView leaf currently open in the main area, if any. Covers the case where a non-file tab (terminal, settings) is focused but a markdown tab is also open.
  3. The first entry in `recentFiles` that still resolves to a file in the vault. Survives plugin reloads where Obsidian's in-memory tracking has been cleared.

  Only `null` if no file has ever been opened in this vault.
