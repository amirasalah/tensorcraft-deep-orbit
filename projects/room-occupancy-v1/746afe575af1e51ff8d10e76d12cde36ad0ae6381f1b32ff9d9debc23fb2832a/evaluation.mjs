import { FEATURES } from "./preprocessing.mjs";
export function validatePlan(plan, rows) {
  const byId = new Map(rows.map((row) => [row.id, row]));
  const seen = new Set(),
    sets = {};
  for (const name of ["train", "validation", "test"]) {
    const ids = plan?.split?.[name];
    if (!Array.isArray(ids) || !ids.length)
      throw new Error(`Provide nonempty ${name} row IDs in plan.json.`);
    sets[name] = ids
      .map((id) => {
        if (!byId.has(id) || seen.has(id))
          throw new Error(`Unknown or overlapping split row: ${id}`);
        seen.add(id);
        return byId.get(id);
      })
      .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
  }
  if (
    sets.train.at(-1).recordedAt >= sets.validation[0].recordedAt ||
    sets.validation.at(-1).recordedAt >= sets.test[0].recordedAt
  ) {
    throw new Error(
      "Use strictly ordered training, validation and final periods.",
    );
  }
  const fitIds = plan.preprocessingFitIds;
  if (
    !Array.isArray(fitIds) ||
    new Set(fitIds).size !== fitIds.length ||
    fitIds.length !== plan.split.train.length ||
    !fitIds.every((id) => plan.split.train.includes(id))
  ) {
    throw new Error(
      "Record exactly the training row IDs used to fit preprocessing.",
    );
  }
  for (const field of ["falsePositive", "falseNegative"]) {
    if (!Number.isFinite(plan?.costs?.[field]) || plan.costs[field] < 0)
      throw new Error("Error costs must be finite and nonnegative.");
  }
  if (plan.costs.falsePositive + plan.costs.falseNegative <= 0)
    throw new Error("At least one error cost must be positive.");
  baselinePrediction(plan.baseline, rows[0]);
  for (const key of [
    "predictionTime",
    "splitReason",
    "metricReason",
    "baselineReason",
    "validationChoices",
  ]) {
    if (typeof plan[key] !== "string" || !plan[key].trim())
      throw new Error(`Explain ${key} in plan.json.`);
  }
  return sets;
}
export function baselinePrediction(policy, row) {
  if (policy?.kind === "constant" && [0, 1].includes(policy.value))
    return policy.value;
  if (
    policy?.kind === "threshold" &&
    FEATURES.includes(policy.feature) &&
    Number.isFinite(policy.threshold) &&
    ["gte", "lte"].includes(policy.direction)
  ) {
    if (!Number.isFinite(row[policy.feature]))
      throw new Error("Missing baseline input.");
    return Number(
      policy.direction === "gte"
        ? row[policy.feature] >= policy.threshold
        : row[policy.feature] <= policy.threshold,
    );
  }
  throw new Error(
    "Choose a constant or one-feature threshold baseline. README.md describes the format.",
  );
}
export function metrics(labels, predictions, costs) {
  if (
    !labels.length ||
    labels.length !== predictions.length ||
    ![...labels, ...predictions].every((x) => x === 0 || x === 1)
  )
    throw new Error("Expected paired nonempty binary labels and predictions.");
  let tp = 0,
    fp = 0,
    tn = 0,
    fn = 0;
  labels.forEach((label, i) => {
    if (label) {
      if (predictions[i]) tp++;
      else fn++;
    } else {
      if (predictions[i]) fp++;
      else tn++;
    }
  });
  return {
    tp,
    fp,
    tn,
    fn,
    count: labels.length,
    accuracy: (tp + tn) / labels.length,
    precision: tp + fp ? tp / (tp + fp) : null,
    recall: tp + fn ? tp / (tp + fn) : null,
    totalErrorCost: fp * costs.falsePositive + fn * costs.falseNegative,
  };
}
