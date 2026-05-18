import {
  authedFetch,
  unauthFetch,
  ensureServerReachable,
  resetFixture,
  deleteFixture,
} from "./client";
import { TEST_DIR } from "./fixtures";

// Unique names so wikilinks resolve unambiguously even in vaults that happen to
// contain notes with common names.
const HUB_PATH      = `${TEST_DIR}/graph-hub-xylophone.md`;
const LINKER1_PATH  = `${TEST_DIR}/graph-linker-1-xylophone.md`;
const LINKER2_PATH  = `${TEST_DIR}/graph-linker-2-xylophone.md`;
const LINKER3_PATH  = `${TEST_DIR}/graph-linker-3-xylophone.md`;
const ORPHAN_PATH   = `${TEST_DIR}/graph-orphan-xylophone.md`;

const HUB_DOC = `---
title: Graph Hub Fixture
---

# Hub

Acts as the inbound target for the linker fixtures.
`;

const LINKER1_DOC = `# Linker One\n\nLinks to [[graph-hub-xylophone]].\n`;
const LINKER2_DOC = `# Linker Two\n\nLinks to [[graph-hub-xylophone]] and [[graph-linker-1-xylophone]].\n`;
const LINKER3_DOC = `# Linker Three\n\nLinks to [[graph-hub-xylophone]].\n`;
const ORPHAN_DOC  = `# Orphan\n\nNo links in or out. xylophone-graph-orphan-unique.\n`;

beforeAll(async () => {
  await ensureServerReachable();
  // Order matters: create the hub first so wikilinks in linker docs resolve
  // immediately on first index pass.
  await resetFixture(HUB_DOC, HUB_PATH);
  await resetFixture(LINKER1_DOC, LINKER1_PATH);
  await resetFixture(LINKER2_DOC, LINKER2_PATH);
  await resetFixture(LINKER3_DOC, LINKER3_PATH);
  await resetFixture(ORPHAN_DOC, ORPHAN_PATH);
});

afterAll(async () => {
  await deleteFixture(HUB_PATH);
  await deleteFixture(LINKER1_PATH);
  await deleteFixture(LINKER2_PATH);
  await deleteFixture(LINKER3_PATH);
  await deleteFixture(ORPHAN_PATH);
});

interface GraphNoteResult {
  path: string;
  inboundCount: number;
  outboundCount: number;
  tags: string[];
  frontmatterExcerpt: string;
  contentExcerpt: string;
}

interface GraphNeighborResult extends GraphNoteResult {
  distance: number;
}

async function postJson<T>(path: string, body: unknown): Promise<{ status: number; body: T }> {
  const res = await authedFetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const parsed = res.status === 204 ? (undefined as unknown as T) : ((await res.json()) as T);
  return { status: res.status, body: parsed };
}

// ---------------------------------------------------------------------------
// POST /graph/orphans/
// ---------------------------------------------------------------------------

describe("POST /graph/orphans/", () => {
  test("returns the fixture orphan among strict orphans", async () => {
    const { status, body } = await postJson<{ results: GraphNoteResult[] }>(
      "/graph/orphans/",
      { maxResults: 5000 },
    );
    expect(status).toBe(200);
    const orphan = body.results.find((r) => r.path === ORPHAN_PATH);
    expect(orphan).toBeDefined();
    expect(orphan?.inboundCount).toBe(0);
    expect(orphan?.outboundCount).toBe(0);
  });

  test("hub is NOT an orphan when graph is intact", async () => {
    const { status, body } = await postJson<{ results: GraphNoteResult[] }>(
      "/graph/orphans/",
      { maxResults: 5000 },
    );
    expect(status).toBe(200);
    expect(body.results.find((r) => r.path === HUB_PATH)).toBeUndefined();
  });

  test("excludeFromGraph removes link contribution: hub becomes orphan when linkers are excluded", async () => {
    const { status, body } = await postJson<{ results: GraphNoteResult[] }>(
      "/graph/orphans/",
      {
        maxResults: 5000,
        excludeFromGraph: [`${TEST_DIR}/graph-linker-*-xylophone.md`],
      },
    );
    expect(status).toBe(200);
    expect(body.results.some((r) => r.path === HUB_PATH)).toBe(true);
  });

  test("returns 400 on negative minInbound", async () => {
    const { status } = await postJson("/graph/orphans/", { minInbound: -1 });
    expect(status).toBe(400);
  });

  test("returns 401 without auth", async () => {
    const res = await unauthFetch("/graph/orphans/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// POST /graph/neighborhood/
// ---------------------------------------------------------------------------

describe("POST /graph/neighborhood/", () => {
  test("hub neighborhood includes all three linkers via backlinks", async () => {
    const { status, body } = await postJson<{ results: GraphNeighborResult[] }>(
      "/graph/neighborhood/",
      { path: HUB_PATH, hops: 1 },
    );
    expect(status).toBe(200);
    const paths = body.results.map((r) => r.path);
    expect(paths).toEqual(expect.arrayContaining([LINKER1_PATH, LINKER2_PATH, LINKER3_PATH]));
    expect(paths).not.toContain(HUB_PATH);
  });

  test("includeBacklinks=false on hub yields no neighbors (hub has no outbound)", async () => {
    const { status, body } = await postJson<{ results: GraphNeighborResult[] }>(
      "/graph/neighborhood/",
      { path: HUB_PATH, hops: 2, includeBacklinks: false },
    );
    expect(status).toBe(200);
    expect(body.results).toEqual([]);
  });

  test("returns 404 for missing center note", async () => {
    const { status } = await postJson(
      "/graph/neighborhood/",
      { path: `${TEST_DIR}/does-not-exist-xyz.md` },
    );
    expect(status).toBe(404);
  });

  test("returns 400 for hops > 4", async () => {
    const { status } = await postJson(
      "/graph/neighborhood/",
      { path: HUB_PATH, hops: 5 },
    );
    expect(status).toBe(400);
  });

  test("returns 400 when path missing", async () => {
    const { status } = await postJson("/graph/neighborhood/", {});
    expect(status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// POST /graph/hubs/
// ---------------------------------------------------------------------------

describe("POST /graph/hubs/", () => {
  test("includes the fixture hub when scoping to the fixture subgraph", async () => {
    // excludeFromGraph everything outside our fixture dir is impossible with our
    // glob library (no negation). Instead use a high maxResults and look for the
    // hub anywhere in the result list.
    const { status, body } = await postJson<{ results: GraphNoteResult[] }>(
      "/graph/hubs/",
      { maxResults: 5000 },
    );
    expect(status).toBe(200);
    const hub = body.results.find((r) => r.path === HUB_PATH);
    expect(hub).toBeDefined();
    expect(hub?.inboundCount).toBeGreaterThanOrEqual(3);
  });

  test("orphan is never returned (zero inbound)", async () => {
    const { status, body } = await postJson<{ results: GraphNoteResult[] }>(
      "/graph/hubs/",
      { maxResults: 5000 },
    );
    expect(status).toBe(200);
    expect(body.results.find((r) => r.path === ORPHAN_PATH)).toBeUndefined();
  });
});
