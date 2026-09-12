import test from "node:test";
import assert from "node:assert/strict";
import { shuffle, orderCandidates, createBallot } from "../src/ballot.js";
import { candidates } from "../src/candidates.js";
import { createDemoService } from "../src/services/demo.js";
const config = { leaderCount: 2, representativeCount: 6 };
test("shuffle preserves the source and house ordering stays intact within each group", () => {
  const source = [1, 2, 3, 4],
    result = shuffle(source, () => 0);
  assert.deepEqual(source, [1, 2, 3, 4]);
  assert.deepEqual(result, [2, 3, 4, 1]);
  const ordered = orderCandidates(candidates, () => 0);
  assert.equal(new Set(ordered.map((c) => c.id)).size, candidates.length);
  assert.deepEqual(
    ordered.filter((c) => c.house === "Orchard").map((c) => c.id),
    ["demo-01", "demo-02"],
  );
});
test("incomplete ballots and unknown candidates are rejected", () => {
  const b = createBallot(candidates, config);
  assert.throws(() => b.payload(), /Complete/);
  assert.throws(() => b.toggle("leaders", "unknown"), /Unknown/);
});
test("selection limits never silently replace a choice", () => {
  const b = createBallot(candidates, config);
  b.toggle("leaders", "demo-01");
  b.toggle("leaders", "demo-02");
  assert.throws(() => b.toggle("leaders", "demo-03"), /Deselect/);
  assert.deepEqual(b.selections("leaders"), ["demo-01", "demo-02"]);
});
test("overlapping roles are blocked and editing leaders reconciles representatives", () => {
  const b = createBallot(candidates, config);
  b.toggle("leaders", "demo-01");
  assert.throws(() => b.toggle("representatives", "demo-01"), /Already/);
  b.toggle("representatives", "demo-02");
  b.toggle("leaders", "demo-02");
  assert.deepEqual(b.selections("representatives"), []);
});
test("a complete ballot uses unique IDs and both required counts", () => {
  const b = createBallot(candidates, config);
  ["demo-01", "demo-02"].forEach((id) => b.toggle("leaders", id));
  ["demo-03", "demo-04", "demo-05", "demo-06", "demo-07", "demo-08"].forEach(
    (id) => b.toggle("representatives", id),
  );
  assert.equal(Object.keys(b.payload().leaders).length, 2);
  assert.equal(Object.keys(b.payload().representatives).length, 6);
  b.toggle("representatives", "demo-08");
  assert.throws(() => b.payload());
});
test("demo service records no ballot and rejects duplicate completion", async () => {
  const service = createDemoService();
  assert.deepEqual(await service.submit(), { demo: true });
  await assert.rejects(service.submit(), /already/);
});
test("invalid counts and duplicate identifiers fail early", () => {
  assert.throws(() =>
    createBallot(candidates, { leaderCount: 0, representativeCount: 6 }),
  );
  assert.throws(() => createBallot([...candidates, candidates[0]], config));
});
