import {
  validateMetadata,
  vectorFor,
  assertModelShape,
  validateScore,
} from "./preprocessing.mjs";
const status = document.querySelector("#status"),
  result = document.querySelector("#result");
const button = document.querySelector("#predict"),
  form = document.querySelector("#predict-form");
const units = {
  temperature: "Temperature (C)",
  humidity: "Relative humidity (%)",
  light: "Light (lux)",
  co2: "CO2 (ppm)",
  humidityRatio: "Humidity ratio (kg water vapor / kg air)",
};
let model, metadata;
async function checkedFile(name, hashes) {
  const response = await fetch(`/model/${name}`);
  if (!response.ok)
    throw new Error(`Cannot load ${name}. Export and check the model first.`);
  const bytes = await response.arrayBuffer();
  const digest = Array.from(
    new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
  )
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  if (digest !== hashes[name])
    throw new Error(`Artifact changed: ${name}. Export it again.`);
  return bytes;
}
try {
  const response = await fetch("/model/checksums.json");
  if (!response.ok)
    throw new Error(
      "Model files are missing. Train and export the model, then run npm run check.",
    );
  const hashes = await response.json();
  const [modelBytes, weights, metaBytes] = await Promise.all(
    ["model.json", "weights.bin", "preprocessing.json"].map((name) =>
      checkedFile(name, hashes),
    ),
  );
  const json = JSON.parse(new TextDecoder().decode(modelBytes));
  metadata = validateMetadata(JSON.parse(new TextDecoder().decode(metaBytes)));
  if (
    json.weightsManifest.length !== 1 ||
    JSON.stringify(json.weightsManifest[0].paths) !== '["weights.bin"]'
  )
    throw new Error("Unsupported weight manifest.");
  await tf.ready();
  model = await tf.loadLayersModel(
    tf.io.fromMemory({
      modelTopology: json.modelTopology,
      weightSpecs: json.weightsManifest[0].weights,
      weightData: weights,
    }),
  );
  assertModelShape(model, metadata);
  for (const feature of metadata.features) {
    const label = document.createElement("label");
    label.textContent = units[feature];
    const input = document.createElement("input");
    input.name = feature;
    input.type = "number";
    input.step = "any";
    input.required = true;
    label.append(input);
    document.querySelector("#fields").append(label);
  }
  document.querySelector("#details").textContent =
    `TFJS ${tf.version.tfjs}; backend ${tf.getBackend()}. Occupied when score >= ${metadata.threshold}. Scores are not a calibration guarantee.`;
  status.textContent = "Model ready. Enter readings to predict.";
  button.disabled = false;
} catch (error) {
  model?.dispose();
  model = null;
  status.textContent = `Unable to predict: ${error.message}`;
}
form.addEventListener("input", () => {
  result.textContent = "";
});
form.addEventListener("submit", (event) => {
  event.preventDefault();
  result.textContent = "";
  if (!model) return;
  try {
    const raw = Object.fromEntries(
      metadata.features.map((f) => {
        const value = form.elements.namedItem(f).value;
        if (!value.trim()) throw new Error(`Enter ${f}.`);
        return [f, Number(value)];
      }),
    );
    const started = performance.now();
    const score = tf.tidy(() =>
      validateScore(
        model.predict(tf.tensor2d([vectorFor(raw, metadata)])).dataSync()[0],
      ),
    );
    const elapsed = performance.now() - started;
    result.textContent = `${score >= metadata.threshold ? "Occupied" : "Unoccupied"}: score ${score.toFixed(6)}. Inference plus readback ${elapsed.toFixed(1)} ms on this device.`;
  } catch (error) {
    result.textContent = `No prediction: ${error.message}`;
  }
});
