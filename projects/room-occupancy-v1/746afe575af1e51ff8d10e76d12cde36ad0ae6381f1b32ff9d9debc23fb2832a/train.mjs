// Maintainer integration fixture, excluded from the learner download.
// This verifies the scaffold; it is not a recommended modeling solution.
import { readFile, writeFile } from "node:fs/promises";
import * as tf from "@tensorflow/tfjs";
import { saveArtifact } from "./artifact.mjs";
import { vectorFor } from "./preprocessing.mjs";
await tf.setBackend("cpu");
const { rows } = JSON.parse(await readFile("data.json", "utf8"));
const train = rows.slice(0, 1200),
  validation = rows.slice(1200, 1600),
  test = rows.slice(1600);
const features = ["temperature", "light", "co2"];
const mean = features.map(
  (f) => train.reduce((sum, r) => sum + r[f], 0) / train.length,
);
const std = features.map(
  (f, i) =>
    Math.sqrt(
      train.reduce((sum, r) => sum + (r[f] - mean[i]) ** 2, 0) / train.length,
    ) || 1,
);
const meta = { version: 1, features, mean, std, threshold: 0.5 };
const plan = {
  predictionTime: "Measurements available at the current reading.",
  split: {
    train: train.map((r) => r.id),
    validation: validation.map((r) => r.id),
    test: test.map((r) => r.id),
  },
  preprocessingFitIds: train.map((r) => r.id),
  splitReason:
    "Chronological periods for the same room. This fixed split is a maintainer fixture, not a quality recommendation.",
  costs: { falsePositive: 1, falseNegative: 4 },
  metricReason: "Hypothetical review costs, for checking evaluator arithmetic.",
  baseline: {
    kind: "threshold",
    feature: "light",
    threshold: 100,
    direction: "gte",
  },
  baselineReason:
    "A fixed one-feature rule verifies a baseline can be evaluated alongside the model.",
  validationChoices:
    "No search. Five fixed epochs exercise the artifact path; this is not optimized for the dataset.",
};
await writeFile("plan.json", JSON.stringify(plan, null, 2));
const model = tf.sequential();
model.add(
  tf.layers.dense({
    inputShape: [features.length],
    units: 1,
    activation: "sigmoid",
    kernelInitializer: tf.initializers.glorotUniform({ seed: 17 }),
  }),
);
model.compile({ optimizer: tf.train.adam(0.01), loss: "binaryCrossentropy" });
const xs = tf.tensor2d(train.map((r) => vectorFor(r, meta))),
  ys = tf.tensor2d(train.map((r) => [r.occupied]));
try {
  await model.fit(xs, ys, {
    epochs: 5,
    batchSize: 32,
    shuffle: false,
    verbose: 0,
  });
  await saveArtifact(model, meta, [
    train[0],
    train[300],
    validation[50],
    validation[300],
  ]);
} finally {
  xs.dispose();
  ys.dispose();
  model.dispose();
}
console.log(
  "Maintainer fixture exported a real fitted model. No learner mastery claim.",
);
