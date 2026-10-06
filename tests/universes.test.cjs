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
const { writeLocalIfChanged } = require("../lib/localStore.ts");
const { validateGrade } = require("../lib/gradeValidation.ts");
const {
  reviewKeys,
  answeredCount,
  validateDailyReview,
  shouldOpenEveningReview,
} = require("../lib/dailyReview.ts");
test("Evening review opens after the configured hour once per unfinished day", () => {
  assert.equal(
    shouldOpenEveningReview(new Date(2026, 9, 6, 16, 59), 17, false, false),
    false,
  );
  assert.equal(
    shouldOpenEveningReview(new Date(2026, 9, 6, 17, 0), 17, false, false),
    true,
  );
  assert.equal(
    shouldOpenEveningReview(new Date(2026, 9, 6, 19, 0), 17, true, false),
    false,
  );
  assert.equal(
    shouldOpenEveningReview(new Date(2026, 9, 6, 19, 0), 17, false, true),
    false,
  );
});
test("Finishing a review requires all sixteen answers; drafts may be partial", () => {
  const today = require("../lib/life.ts").localDay();
  assert.equal(new Set(reviewKeys).size, 16);
  assert.doesNotThrow(() =>
    validateDailyReview(today, { "academic:lessons": "Maths" }, false),
  );
  assert.throws(() =>
    validateDailyReview(today, { "academic:lessons": "Maths" }, true),
  );
  const answers = Object.fromEntries(
    reviewKeys.map((k) => [k, "Rien à signaler aujourd’hui."]),
  );
  assert.equal(answeredCount(answers), 16);
  assert.doesNotThrow(() => validateDailyReview(today, answers, true));
});
test("Review rejects impossible dates, unknown fields and oversized answers", () => {
  const today = require("../lib/life.ts").localDay();
  assert.throws(() => validateDailyReview("2026-02-30", {}, false));
  assert.throws(() => validateDailyReview("2999-01-01", {}, false));
  assert.throws(() => validateDailyReview(today, { unknown: "x" }, false));
  assert.throws(() =>
    validateDailyReview(today, { "health:energy": "x".repeat(3001) }, false),
  );
});
test("Grade edits retain mixed scales, fractional coefficients and zero scores", () => {
  const grade = {
    subjectId: "maths",
    title: "Contrôle",
    score: 0,
    outOf: 5,
    coefficient: 0.5,
    takenAt: "2026-10-06T12:00:00Z",
  };
  assert.doesNotThrow(() => validateGrade(grade));
  assert.throws(() => validateGrade({ ...grade, score: 6 }));
  assert.throws(() => validateGrade({ ...grade, coefficient: 0 }));
  assert.throws(() => validateGrade({ ...grade, outOf: 0 }));
  assert.throws(() => validateGrade({ ...grade, takenAt: "invalid" }));
});
test("Refreshing unchanged local data does not broadcast another storage write", () => {
  let raw = null,
    writes = 0;
  const storage = {
    getItem: () => raw,
    setItem: (_, v) => {
      writes++;
      raw = v;
    },
  };
  const data = { tasks: [{ id: "t", title: "Révision" }] };
  assert.equal(writeLocalIfChanged(storage, "key", data), true);
  assert.equal(writeLocalIfChanged(storage, "key", data), false);
  assert.equal(writes, 1);
  assert.equal(writeLocalIfChanged(storage, "key", { tasks: [] }), true);
  assert.equal(writes, 2);
});
const {
  revisionPlan,
  resultInR,
  healthWindow,
  habitWeek,
  weeklyMemory,
  searchIndex,
  findItems,
  memoryHistory,
} = require("../lib/progress.ts");

test("Revision suggestions prioritize imminent exams and recurring chapter errors", () => {
  const state = {
    chapters: [
      { id: "a", subjectId: "s", title: "A", status: "solid" },
      { id: "b", subjectId: "other", title: "B", status: "learning" },
    ],
    errors: [
      {
        chapterId: "a",
        status: "review",
        lapses: 3,
        nextReviewAt: "2026-10-05T08:00:00Z",
      },
    ],
    tasks: [
      {
        id: "exam",
        subjectId: "s",
        kind: "exam",
        status: "todo",
        dueAt: "2026-10-09T08:00:00Z",
      },
    ],
  };
  const plan = revisionPlan(state, new Date("2026-10-06T08:00:00Z"));
  assert.equal(plan[0].chapter.id, "a");
  assert.equal(plan[0].due.length, 1);
  assert.equal(plan[0].exam.id, "exam");
});
test("R uses initial risk, trade direction and fees and rejects missing risk", () => {
  const trade = {
    status: "closed",
    entry: 100,
    exit: 110,
    quantity: 2,
    direction: "long",
  };
  assert.equal(resultInR(trade, 5, 2), 3.6);
  assert.equal(resultInR({ ...trade, direction: "short" }, 5), -4);
  assert.equal(resultInR(trade, null), null);
  assert.equal(resultInR(trade, 0), null);
  assert.equal(resultInR({ ...trade, status: "open" }, 5), null);
});
test("30-day health window preserves unknown days and excludes other universes", () => {
  const rows = healthWindow(
    [
      entry("health-day", { day: "2026-10-05", data: { sleep: 0 } }),
      entry("health-day", {
        universe: "finance",
        day: "2026-10-05",
        data: { sleep: 9 },
      }),
    ],
    "2026-10-06",
  );
  assert.equal(rows.length, 30);
  assert.equal(rows.at(-1).sleep, null);
  assert.equal(rows.at(-2).sleep, 0);
  assert.deepEqual(habitWeek([], "2026-10-06"), []);
});
test("Global search is accent insensitive and does not index private attachment payloads", () => {
  const state = {
    subjects: [],
    tasks: [],
    chapters: [],
    grades: [],
    errors: [],
    goals: [],
    resources: [],
  };
  const index = searchIndex(
    state,
    [
      entry("resource", {
        title: "Révision",
        data: {
          notes: "Méthode utile",
          fileData: "SECRETBASE64",
          path: "SECRETPATH",
        },
      }),
    ],
    [],
  );
  assert.equal(findItems(index, "revision methode").length, 1);
  assert.equal(findItems(index, "SECRETBASE64").length, 0);
  assert.equal(findItems(index, "SECRETPATH").length, 0);
  assert.equal(findItems(index, "").length, 0);
});
test("Memorization history tolerates corrupt legacy data and counts distinct passages", () => {
  const card = entry("memorization", {
    universe: "islam",
    data: { lastReviewed: "2026-10-05T12:00:00Z", reviewHistory: "not-json" },
  });
  assert.deepEqual(memoryHistory(card), []);
  assert.equal(weeklyMemory([card], "2026-10-06"), 1);
  assert.equal(weeklyMemory([{ ...card, archived: true }], "2026-10-06"), 0);
});
test("Quiz and trade review validate answer choices, risk and fees", () => {
  const base = {
    universe: "finance",
    kind: "reflection",
    title: "Quiz",
    day: "2026-10-06",
  };
  assert.throws(() =>
    validateLife({
      ...base,
      data: { studioType: "quiz", answerKey: "B", optionA: "A" },
    }),
  );
  assert.doesNotThrow(() =>
    validateLife({
      ...base,
      data: { studioType: "quiz", answerKey: "B", optionA: "A", optionB: "B" },
    }),
  );
  assert.throws(() =>
    validateLife({ ...base, data: { type: "trade-review", risk: 0, fees: 0 } }),
  );
  assert.throws(() =>
    validateLife({
      ...base,
      data: { type: "trade-review", risk: 10, fees: -1 },
    }),
  );
});
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
