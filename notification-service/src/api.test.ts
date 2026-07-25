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
