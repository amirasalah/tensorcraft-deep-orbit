import * as tf from "@tensorflow/tfjs";
import { loadArtifact, predictRows } from "./artifact.mjs";
await tf.setBackend("cpu");
const { model, meta, parity } = await loadArtifact();
try {
  if (!Array.isArray(parity) || parity.length < 3)
    throw new Error("Missing parity examples.");
  const actual = predictRows(
    model,
    meta,
    parity.map((x) => x.row),
  );
  parity.forEach((example, i) => {
    if (
      !Number.isFinite(example.score) ||
      Math.abs(actual[i] - example.score) > 1e-5
    ) {
      throw new Error(`Prediction changed after reload at parity row ${i}.`);
    }
  });
  console.log(
    `Artifact reload matches ${parity.length} original scores within 1e-5 on TFJS ${tf.version.tfjs} / ${tf.getBackend()}.`,
  );
  console.log(
    "This checks export and inference parity. It does not establish model quality or an assessment pass.",
  );
} finally {
  model.dispose();
}
