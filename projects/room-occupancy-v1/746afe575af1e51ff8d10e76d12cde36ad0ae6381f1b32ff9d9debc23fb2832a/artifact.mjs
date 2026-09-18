import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import * as tf from "@tensorflow/tfjs";
import {
  assertModelShape,
  validateMetadata,
  validateScore,
  vectorFor,
} from "./preprocessing.mjs";

export const digest = (bytes) =>
  createHash("sha256").update(bytes).digest("hex");
export function predictRows(model, meta, rows) {
  return tf.tidy(() => {
    const xs = tf.tensor2d(rows.map((row) => vectorFor(row, meta)));
    return Array.from(model.predict(xs).dataSync()).map(validateScore);
  });
}
// Pass representative raw rows so a fresh process can compare inference.
export async function saveArtifact(
  model,
  metadata,
  parityRows,
  directory = "model",
) {
  validateMetadata(metadata);
  assertModelShape(model, metadata);
  if (!Array.isArray(parityRows) || parityRows.length < 3)
    throw new Error("Provide at least three parity rows.");
  const scores = predictRows(model, metadata, parityRows);
  await mkdir(directory, { recursive: true });
  await model.save(
    tf.io.withSaveHandler(async (artifacts) => {
      const weights = Buffer.from(artifacts.weightData);
      const json = {
        format: "layers-model",
        generatedBy: `TensorFlow.js ${tf.version.tfjs}`,
        modelTopology: artifacts.modelTopology,
        weightsManifest: [
          { paths: ["weights.bin"], weights: artifacts.weightSpecs },
        ],
      };
      const files = {
        "model.json": JSON.stringify(json),
        "weights.bin": weights,
        "preprocessing.json": JSON.stringify(metadata),
        "parity.json": JSON.stringify(
          parityRows.map((row, i) => ({ row, score: scores[i] })),
        ),
      };
      for (const [name, bytes] of Object.entries(files))
        await writeFile(`${directory}/${name}`, bytes);
      await writeFile(
        `${directory}/checksums.json`,
        JSON.stringify(
          Object.fromEntries(
            Object.entries(files).map(([name, bytes]) => [name, digest(bytes)]),
          ),
          null,
          2,
        ),
      );
      return {
        modelArtifactsInfo: {
          dateSaved: new Date(),
          modelTopologyType: "JSON",
          weightDataBytes: weights.length,
        },
      };
    }),
  );
}
export async function loadArtifact(directory = "model") {
  const hashes = JSON.parse(
    await readFile(`${directory}/checksums.json`, "utf8"),
  );
  const files = {};
  for (const name of [
    "model.json",
    "weights.bin",
    "preprocessing.json",
    "parity.json",
  ]) {
    files[name] = await readFile(`${directory}/${name}`);
    if (digest(files[name]) !== hashes[name])
      throw new Error(`Artifact changed: ${name}. Export it again.`);
  }
  const json = JSON.parse(files["model.json"]);
  const meta = validateMetadata(JSON.parse(files["preprocessing.json"]));
  if (
    json.weightsManifest.length !== 1 ||
    JSON.stringify(json.weightsManifest[0].paths) !== '["weights.bin"]'
  ) {
    throw new Error("Expected one local weights.bin file.");
  }
  const buffer = files["weights.bin"];
  const model = await tf.loadLayersModel(
    tf.io.fromMemory({
      modelTopology: json.modelTopology,
      weightSpecs: json.weightsManifest[0].weights,
      weightData: buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength,
      ),
    }),
  );
  try {
    assertModelShape(model, meta);
    return { model, meta, parity: JSON.parse(files["parity.json"]), hashes };
  } catch (error) {
    model.dispose();
    throw error;
  }
}
