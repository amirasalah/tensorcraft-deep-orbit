import { readFile, writeFile, mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import * as tf from "@tensorflow/tfjs";
import { loadArtifact, predictRows, digest } from "./artifact.mjs";
import { validatePlan, baselinePrediction, metrics } from "./evaluation.mjs";
await tf.setBackend("cpu");
const { rows } = JSON.parse(await readFile("data.json", "utf8"));
const planText = await readFile("plan.json", "utf8"),
  plan = JSON.parse(planText);
const sets = validatePlan(plan, rows);
const phase = process.argv[2];
if (!["validation", "test"].includes(phase))
  throw new Error(
    "Use npm run evaluate -- validation while choosing settings; use -- test only after freezing them.",
  );
const { model, meta, hashes } = await loadArtifact();
try {
  const selected = sets[phase],
    scores = predictRows(model, meta, selected);
  const labels = selected.map((r) => r.occupied),
    predicted = scores.map((s) => Number(s >= meta.threshold));
  const baseline = selected.map((row) =>
    baselinePrediction(plan.baseline, row),
  );
  const report = {
    recordedAt: new Date().toISOString(),
    phase,
    tfjs: tf.version.tfjs,
    backend: tf.getBackend(),
    planSha256: digest(planText),
    artifactHashes: hashes,
    plan,
    splitSummary: Object.fromEntries(
      Object.entries(sets).map(([name, r]) => [
        name,
        {
          count: r.length,
          first: r[0].recordedAt,
          last: r.at(-1).recordedAt,
          occupiedRate: r.reduce((n, x) => n + x.occupied, 0) / r.length,
        },
      ]),
    ),
    model: metrics(labels, predicted, plan.costs),
    baseline: metrics(labels, baseline, plan.costs),
    predictions: selected.map((row, i) => ({
      id: row.id,
      label: labels[i],
      score: scores[i],
      model: predicted[i],
      baseline: baseline[i],
    })),
    interpretation:
      "Measured comparison on this subset. Review costs, leakage, errors and limitations before recommending a policy.",
  };
  await mkdir("runs", { recursive: true });
  const file = `runs/${phase}-${Date.now()}-${randomUUID()}.json`;
  await writeFile(file, JSON.stringify(report, null, 2));
  console.log(
    JSON.stringify(
      { file, model: report.model, baseline: report.baseline },
      null,
      2,
    ),
  );
  if (phase === "test")
    console.log(
      "Final-period results are now visible. Further choices informed by them need a new test period. Keep this run in your report.",
    );
} finally {
  model.dispose();
}
