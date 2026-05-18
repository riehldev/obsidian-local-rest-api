import {
  authedFetch,
  unauthFetch,
  ensureServerReachable,
} from "./client";

beforeAll(async () => {
  await ensureServerReachable();
});

interface WorkspaceState {
  focused: {
    path: string | null;
    viewType: string;
    mode?: string;
    cursor?: { line: number; ch: number };
    selection?: {
      anchor: { line: number; ch: number };
      head: { line: number; ch: number };
    };
  } | null;
  tabs: { path: string | null; viewType: string; isFocused: boolean }[];
  recentFiles: string[];
  mostRecentActiveFile: string | null;
}

describe("GET /workspace/", () => {
  test("returns a workspace state object with all required fields", async () => {
    const res = await authedFetch("/workspace/");
    expect(res.status).toBe(200);
    const body = (await res.json()) as WorkspaceState;

    // Shape only — we can't make strict assertions about live workspace contents.
    expect(body).toHaveProperty("focused");
    expect(Array.isArray(body.tabs)).toBe(true);
    expect(Array.isArray(body.recentFiles)).toBe(true);
    expect(body).toHaveProperty("mostRecentActiveFile");
  });

  test("tabs entries have the expected shape", async () => {
    const res = await authedFetch("/workspace/");
    const body = (await res.json()) as WorkspaceState;
    for (const tab of body.tabs) {
      expect(typeof tab.viewType).toBe("string");
      expect(typeof tab.isFocused).toBe("boolean");
      expect(tab.path === null || typeof tab.path === "string").toBe(true);
    }
  });

  test("at most one tab is marked as focused", async () => {
    const res = await authedFetch("/workspace/");
    const body = (await res.json()) as WorkspaceState;
    const focusedCount = body.tabs.filter((t) => t.isFocused).length;
    expect(focusedCount).toBeLessThanOrEqual(1);
  });

  test("returns 401 without auth", async () => {
    const res = await unauthFetch("/workspace/");
    expect(res.status).toBe(401);
  });
});
