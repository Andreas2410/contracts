import express, { Request, Response, NextFunction } from "express";
import rateLimit, { Options as RateLimitOptions } from "express-rate-limit";
import { Store } from "./db";
import { NotificationPreference } from "./types";
import { Metrics } from "./metrics";

export interface ApiOptions {
  /** Overrides for the public rate limiter (mainly for tests). */
  rateLimit?: Partial<RateLimitOptions>;
  /** If set, only requests whose Origin header is in this list will receive CORS headers. */
  allowedOrigins?: string[];
  /** Optional metrics instance to expose via GET /metrics. */
  metrics?: Metrics;
}

const DEFAULT_HISTORY_LIMIT = 50;
const MAX_HISTORY_LIMIT = 200;

/** Clamp a query-string pagination param to a safe positive integer, falling back to `fallback`. */
function parsePaginationParam(
  value: unknown,
  fallback: number,
  max?: number,
): number {
  const parsed = typeof value === "string" ? parseInt(value, 10) : NaN;
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return max !== undefined ? Math.min(parsed, max) : parsed;
}

export function createApi(
  store: Store,
  options: ApiOptions = {},
): express.Application {
  const app = express();
  app.use(express.json());

  // ── CORS ───────────────────────────────────────────────────────────────
  // When allowedOrigins is configured, only matching Origin values receive
  // the Access-Control-Allow-Origin header; non-matching origins get no
  // CORS headers, so the browser blocks the cross-origin read. When the
  // list is omitted, no CORS headers are added (framework default).
  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    if (origin && options.allowedOrigins?.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Methods", "GET, PUT, DELETE, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    }
    if (req.method === "OPTIONS") {
      res.status(204).send();
      return;
    }
    next();
  });

  // Basic rate limiting to prevent abuse of these publicly exposed routes.
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 100,
      standardHeaders: true,
      legacyHeaders: false,
      ...options.rateLimit,
    }),
  );

  // GET /health — health check
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // GET /metrics — expose in-memory counters (events processed, notifications sent)
  if (options.metrics) {
    app.get("/metrics", (_req, res) => {
      res.json(options.metrics!.snapshot());
    });
  }

  // GET /preferences — list all notification preferences
  app.get("/preferences", (_req, res) => {
    const prefs = store.listPreferences();
    res.json(prefs);
  });

  // GET /preferences/:address — get preference for a specific investor
  app.get("/preferences/:address", (req, res) => {
    const pref = store.getPreference(req.params.address);
    if (!pref) {
      res.status(404).json({ error: "preference not found" });
      return;
    }
    res.json(pref);
  });

  // PUT /preferences/:address — create or update an investor's preference
  app.put("/preferences/:address", (req, res) => {
    const { email, webhook_url, enabled, min_delta } = req.body;
    const address = req.params.address;

    if (!address) {
      res.status(400).json({ error: "address is required" });
      return;
    }

    if (email && typeof email !== "string") {
      res.status(400).json({ error: "email must be a string" });
      return;
    }

    if (webhook_url && typeof webhook_url !== "string") {
      res.status(400).json({ error: "webhook_url must be a string" });
      return;
    }

    const pref: NotificationPreference = {
      investor_address: address,
      email: email || undefined,
      webhook_url: webhook_url || undefined,
      enabled: enabled !== false,
      min_delta: typeof min_delta === "number" ? min_delta : 1,
      updated_at: new Date().toISOString(),
    };

    store.upsertPreference(pref);
    res.json(pref);
  });

  // DELETE /preferences/:address — remove an investor's preference
  app.delete("/preferences/:address", (req, res) => {
    store.deletePreference(req.params.address);
    res.status(204).send();
  });

  // GET /notifications/history — paginated notification history, optionally
  // filtered to a single investor via ?investor_address=
  app.get("/notifications/history", (req, res) => {
    const limit = parsePaginationParam(
      req.query.limit,
      DEFAULT_HISTORY_LIMIT,
      MAX_HISTORY_LIMIT,
    );
    const offset = parsePaginationParam(req.query.offset, 0);
    const investor_address =
      typeof req.query.investor_address === "string"
        ? req.query.investor_address
        : undefined;

    const page = store.listNotificationHistory({
      investor_address,
      limit,
      offset,
    });
    res.json(page);
  });

  return app;
}
