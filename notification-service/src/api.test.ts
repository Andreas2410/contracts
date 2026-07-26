import { describe, it, expect, afterEach } from "vitest";
import request from "supertest";
import { createApi } from "./api";
import { Store } from "./db";

function makeStore(): Store {
  return new Store(":memory:");
}

describe("createApi rate limiting", () => {
  let store: Store;

  afterEach(() => {
    store?.close();
  });

  it("allows requests under the limit", async () => {
    store = makeStore();
    const app = createApi(store, { rateLimit: { windowMs: 60_000, limit: 3 } });

    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
  });

  it("returns 429 once the public endpoint limit is exceeded", async () => {
    store = makeStore();
    const app = createApi(store, { rateLimit: { windowMs: 60_000, limit: 3 } });

    for (let i = 0; i < 3; i++) {
      const res = await request(app).get("/health");
      expect(res.status).toBe(200);
    }

    const limited = await request(app).get("/health");
    expect(limited.status).toBe(429);
  });

  it("applies the limit across different public routes, not per-route", async () => {
    store = makeStore();
    const app = createApi(store, { rateLimit: { windowMs: 60_000, limit: 2 } });

    await request(app).get("/health");
    await request(app).get("/preferences");
    const limited = await request(app).get("/health");

    expect(limited.status).toBe(429);
  });
});

describe("GET /notifications/history", () => {
  let store: Store;

  afterEach(() => {
    store?.close();
  });

  it("returns a bounded page instead of the full unbounded history", async () => {
    store = makeStore();
    for (let i = 0; i < 5; i++) {
      store.recordNotification("GINVESTOR", 1, "webhook", 100 + i);
    }
    const app = createApi(store);

    const res = await request(app)
      .get("/notifications/history")
      .query({ limit: 2, offset: 0 });

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(2);
    expect(res.body.total).toBe(5);
    expect(res.body.limit).toBe(2);
    expect(res.body.offset).toBe(0);
    // Most recent (highest ledger) first.
    expect(res.body.items[0].ledger).toBe(104);
    expect(res.body.items[1].ledger).toBe(103);
  });

  it("filters by investor_address when provided", async () => {
    store = makeStore();
    store.recordNotification("GINVESTOR", 1, "webhook", 100);
    store.recordNotification("GOTHER", 2, "email", 101);
    const app = createApi(store);

    const res = await request(app)
      .get("/notifications/history")
      .query({ investor_address: "GOTHER" });

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].investor_address).toBe("GOTHER");
    expect(res.body.total).toBe(1);
  });

  it("clamps an excessive limit instead of returning everything", async () => {
    store = makeStore();
    for (let i = 0; i < 3; i++) {
      store.recordNotification("GINVESTOR", 1, "webhook", 100 + i);
    }
    const app = createApi(store);

    const res = await request(app)
      .get("/notifications/history")
      .query({ limit: 999999 });

    expect(res.status).toBe(200);
    expect(res.body.limit).toBeLessThanOrEqual(200);
  });

  it("defaults to an empty page when no notifications have been sent", async () => {
    store = makeStore();
    const app = createApi(store);

    const res = await request(app).get("/notifications/history");

    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
    expect(res.body.total).toBe(0);
  });
});
