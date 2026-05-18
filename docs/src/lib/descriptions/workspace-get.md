Return a live snapshot of the Obsidian workspace UI state — what tab is focused, what other tabs are open in the main area, where the cursor is, and which files were recently opened.

This is the preferred replacement for the older `/active/` GET endpoint when you need to know what the user is actually doing right now, rather than just reading the active file's content. Unlike `getActiveFile()`, this endpoint reports useful information even when the currently focused tab is not a file (terminal, settings, graph view, etc.).

### What's included

- **`focused`** — detail about the currently focused main-area leaf. `null` when no main-area leaves exist. When focused on a markdown file, includes `cursor` and, if a non-empty selection exists, `selection`. Preview-mode markdown views omit cursor info (there is no editor in preview mode).
- **`tabs`** — flat array of every leaf in the main area, with `viewType`, `path` (`null` for non-file views), and `isFocused`. Sidebar leaves (file explorer, outline, backlinks pane, etc.) are intentionally not included.
- **`recentFiles`** — vault-relative paths of up to 10 most recently opened files.
- **`mostRecentActiveFile`** — vault path of the most recently active `FileView`, falling back across non-file tabs. Useful for "what file was the user just on" regardless of current focus.
