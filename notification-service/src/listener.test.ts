import { describe, it, expect } from "vitest";
import { xdr, nativeToScVal } from "@stellar/stellar-sdk";
import { decodeScoreChanged } from "./listener";

const LEDGER = 12345;
const TIMESTAMP = 1_700_000_000;

// The SDK's public .d.ts only exposes named static factories for XDR union
// arms, but ContractEventBody/ExtensionPoint have no named arm — their real
// (runtime) constructor still takes (switch, value), so we go through `any`
// to build valid test fixtures without fighting the incomplete types.
function unionOf<T>(Ctor: unknown, ...args: unknown[]): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new (Ctor as any)(...args);
}

const FULL_SCORES = {
  old_credit_quality: 50,
  new_credit_quality: 60,
  old_green_impact: 40,
  new_green_impact: 45,
  old_rate_bps: 500,
  new_rate_bps: 480,
};

/**
 * Mirrors what `#[contractevent]` actually publishes for `ScoreChanged`
 * (project_registry/src/events.rs): only `project_id` is `#[topic]`, so
 * topics are `[Symbol("score_changed"), project_id]`; the remaining fields
 * default to `data_format = "map"`, i.e. an ScMap keyed by field name — not
 * a positional vector. See EVENTS.md and derive_event.rs's DataFormat::Map
 * branch for the encoding this fixture reproduces.
 */
function buildScoreChangedEvent(
  topicValues: unknown[],
  data: xdr.ScVal,
): xdr.ContractEvent {
  const topics = topicValues.map((v) =>
    typeof v === "string"
      ? nativeToScVal(v, { type: "symbol" })
      : nativeToScVal(v, { type: "u32" }),
  );

  const v0 = new xdr.ContractEventV0({ topics, data });
  const body = unionOf<xdr.ContractEventBody>(xdr.ContractEventBody, 0, v0);
  const ext = unionOf<xdr.ExtensionPoint>(xdr.ExtensionPoint, 0, undefined);

  return new xdr.ContractEvent({
    ext,
    contractId: null,
    type: xdr.ContractEventType.contract(),
    body,
  });
}

function buildDataMap(fields: Record<string, number>): xdr.ScVal {
  const entries = Object.entries(fields)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([key, value]) =>
        new xdr.ScMapEntry({
          key: nativeToScVal(key, { type: "symbol" }),
          val: nativeToScVal(value, { type: "u32" }),
        }),
    );
  return xdr.ScVal.scvMap(entries);
}

describe("decodeScoreChanged", () => {
  it("decodes a well-formed ScoreChanged event (Map data, snake_case topic)", () => {
    const event = buildScoreChangedEvent(
      ["score_changed", 7],
      buildDataMap(FULL_SCORES),
    );

    const decoded = decodeScoreChanged(event, LEDGER, TIMESTAMP);

    expect(decoded).toEqual({
      project_id: 7,
      ...FULL_SCORES,
      timestamp: TIMESTAMP,
      ledger: LEDGER,
    });
  });

  it("returns null when the event name doesn't match", () => {
    const event = buildScoreChangedEvent(
      ["some_other_event", 7],
      buildDataMap(FULL_SCORES),
    );
    expect(decodeScoreChanged(event, LEDGER, TIMESTAMP)).toBeNull();
  });

  it("returns null when fewer than 2 topics are present", () => {
    const event = buildScoreChangedEvent(
      ["score_changed"],
      buildDataMap(FULL_SCORES),
    );
    expect(decodeScoreChanged(event, LEDGER, TIMESTAMP)).toBeNull();
  });

  it("returns null when a required data field is missing instead of coercing to NaN", () => {
    const { new_rate_bps: _drop, ...incomplete } = FULL_SCORES;
    const event = buildScoreChangedEvent(
      ["score_changed", 7],
      buildDataMap(incomplete),
    );
    expect(decodeScoreChanged(event, LEDGER, TIMESTAMP)).toBeNull();
  });

  it("returns null when data is a Vec instead of the expected Map", () => {
    const event = buildScoreChangedEvent(
      ["score_changed", 7],
      xdr.ScVal.scvVec(Object.values(FULL_SCORES).map((v) => nativeToScVal(v, { type: "u32" }))),
    );
    expect(decodeScoreChanged(event, LEDGER, TIMESTAMP)).toBeNull();
  });

  it("returns null when data is void", () => {
    const event = buildScoreChangedEvent(["score_changed", 7], xdr.ScVal.scvVoid());
    expect(decodeScoreChanged(event, LEDGER, TIMESTAMP)).toBeNull();
  });
});
