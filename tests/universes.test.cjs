const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("fs"),
  ts = require("typescript");
require.extensions[".ts"] = (module, path) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(path, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
    path,
  );
const {
  habitStreak,
  healthSummary,
  reviewDue,
  validateLife,
  validDay,
  dayBefore,
  safeUrl,
} = require("../lib/life.ts");
const { tradingSummary, positionSize } = require("../lib/finance.ts");
const entry = (kind, patch = {}) => ({
  id: "x",
  universe: "health",
  kind,
  title: "test",
  day: "2026-10-05",
  value: null,
  data: {},
  archived: false,
  key: null,
  createdAt: "2026-10-05T10:00:00",
  ...patch,
});
test("Daily calendar handles DST and invalid dates", () => {
  assert.equal(dayBefore("2026-10-26"), "2026-10-25");
  assert.equal(validDay("2026-02-29"), false);
  assert.equal(validDay("2028-02-29"), true);
});
test("Habit streak ignores archived and incomplete checks and tolerates today pending", () => {
  const checks = ["2026-10-04", "2026-10-03"].map((day) =>
    entry("habit-check", { day, data: { habitId: "h", done: true } }),
  );
  assert.equal(habitStreak(checks, "h", "2026-10-05"), 2);
  assert.equal(
    habitStreak(
      [
        ...checks,
        entry("habit-check", {
          day: "2026-10-02",
          data: { habitId: "h", done: true },
          archived: true,
        }),
      ],
      "h",
      "2026-10-05",
    ),
    2,
  );
  assert.equal(habitStreak(checks, "other", "2026-10-05"), 0);
});
test("Health averages exclude missing fields while retaining a logged zero", () => {
  const records = [
    entry("health-day", { data: { sleep: 0, water: null } }),
    entry("health-day", { day: "2026-10-04", data: { sleep: 8, water: 1000 } }),
    entry("health-day", { day: "2026-09-01", data: { sleep: 20 } }),
    entry("workout", { value: 30 }),
  ];
  const summary = healthSummary(records, "2026-10-05");
  assert.equal(summary.sleep, 4);
  assert.equal(summary.water, 1000);
  assert.equal(summary.energy, null);
  assert.equal(summary.activity, 30);
});
test("Review Encore remains pending until its precise timestamp, and manual date overrides it", () => {
  const card = entry("memorization", {
    universe: "islam",
    data: { nextReview: "2026-10-05", nextReviewAt: "2026-10-05T10:10:00" },
  });
  assert.equal(reviewDue(card, new Date("2026-10-05T10:00:00")), false);
  assert.equal(reviewDue(card, new Date("2026-10-05T10:10:00")), true);
  assert.equal(
    reviewDue(
      { ...card, data: { ...card.data, nextReview: "2026-10-06" } },
      new Date("2026-10-05T12:00:00"),
    ),
    false,
  );
});
test("Entry validation rejects cross-universe types, impossible data and unsafe resource links", () => {
  assert.throws(() => validateLife(entry("prayers")));
  assert.throws(() =>
    validateLife(entry("health-day", { data: { sleep: 25 } })),
  );
  assert.throws(() => validateLife(entry("goal", { data: { target: 0 } })));
  assert.throws(() => safeUrl("javascript:alert(1)"));
  assert.throws(() =>
    validateLife(
      entry("plan", {
        universe: "finance",
        value: 30,
        data: { time: "25:00" },
      }),
    ),
  );
  assert.doesNotThrow(() =>
    validateLife(entry("health-day", { data: { sleep: 0, water: null } })),
  );
});
const trade = (patch = {}) => ({
  asset: "TEST",
  status: "closed",
  entry: 100,
  exit: 110,
  quantity: 2,
  direction: "long",
  openedAt: "2026-10-01",
  closedAt: "2026-10-01",
  ...patch,
});
test("Trading analytics handles shorts, breakeven, chronological drawdown and open positions", () => {
  const stats = tradingSummary([
    trade({ closedAt: "2026-10-03", exit: 100 }),
    trade(),
    trade({ closedAt: "2026-10-02", direction: "short", exit: 115 }),
    trade({ status: "open", exit: null }),
  ]);
  assert.equal(stats.total, -10);
  assert.equal(stats.wins, 1);
  assert.equal(stats.losses, 1);
  assert.equal(stats.breakeven, 1);
  assert.equal(stats.drawdown, 30);
  assert.ok(Math.abs(stats.winRate - 100 / 3) < 1e-10);
  assert.equal(stats.profitFactor, 2 / 3);
  assert.deepEqual(
    stats.curve.map((p) => p.balance),
    [20, -10, -10],
  );
  assert.equal(tradingSummary([]).winRate, null);
});
test("Position sizing rejects equal stops and invalid capital instead of producing infinity", () => {
  assert.equal(positionSize(1000, 1, 100, 100), null);
  assert.equal(positionSize(-100, 1, 100, 95), null);
  assert.deepEqual(positionSize(1000, 1, 100, 95), {
    riskAmount: 10,
    quantity: 2,
    distance: 5,
  });
  assert.equal(positionSize(1000, NaN, 100, 95), null);
});
