// Used by the training export, Node checks and browser inference.
export const FEATURES = [
  "temperature",
  "humidity",
  "light",
  "co2",
  "humidityRatio",
];
export function validateMetadata(meta) {
  if (
    !meta ||
    meta.version !== 1 ||
    !Array.isArray(meta.features) ||
    meta.features.length === 0 ||
    new Set(meta.features).size !== meta.features.length ||
    !meta.features.every((f) => FEATURES.includes(f)) ||
    !Array.isArray(meta.mean) ||
    !Array.isArray(meta.std) ||
    meta.mean.length !== meta.features.length ||
    meta.std.length !== meta.features.length ||
    !meta.mean.every(Number.isFinite) ||
    !meta.std.every((v) => Number.isFinite(v) && v > 0) ||
    !Number.isFinite(meta.threshold) ||
    meta.threshold < 0 ||
    meta.threshold > 1
  ) {
    throw new Error(
      "Invalid preprocessing metadata. Check features, means, positive scales and threshold.",
    );
  }
  return meta;
}
export function vectorFor(row, meta) {
  validateMetadata(meta);
  return meta.features.map((f, i) => {
    if (!Number.isFinite(row[f]))
      throw new Error(`Enter a finite number for ${f}.`);
    if (
      (f !== "temperature" && row[f] < 0) ||
      (f === "humidity" && row[f] > 100)
    ) {
      throw new Error(`Outside the physical range for ${f}.`);
    }
    const scaled = (row[f] - meta.mean[i]) / meta.std[i];
    if (!Number.isFinite(Math.fround(scaled)))
      throw new Error(`Scaled ${f} exceeds float32 range.`);
    return scaled;
  });
}
export function assertModelShape(model, meta) {
  const input = model.inputs[0]?.shape,
    output = model.outputs[0]?.shape;
  if (
    model.inputs.length !== 1 ||
    model.outputs.length !== 1 ||
    input?.length !== 2 ||
    input[1] !== meta.features.length ||
    output?.length !== 2 ||
    output[1] !== 1
  ) {
    throw new Error(
      "Model shape does not match the saved feature order or one-score output.",
    );
  }
}
export function validateScore(score) {
  if (!Number.isFinite(score) || score < 0 || score > 1)
    throw new Error("Model returned an invalid probability score.");
  return score;
}
