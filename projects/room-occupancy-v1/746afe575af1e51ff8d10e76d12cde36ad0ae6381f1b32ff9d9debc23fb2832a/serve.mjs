import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(import.meta.url);
const base = fileURLToPath(new URL(".", import.meta.url));
const routes = {
  "/": ["index.html", "text/html"],
  "/app.mjs": ["app.mjs", "text/javascript"],
  "/preprocessing.mjs": ["preprocessing.mjs", "text/javascript"],
  "/vendor/tf.min.js": [
    require.resolve("@tensorflow/tfjs/dist/tf.min.js"),
    "text/javascript",
  ],
  ...Object.fromEntries(
    ["model.json", "weights.bin", "preprocessing.json", "checksums.json"].map(
      (name) => [
        `/model/${name}`,
        [
          `model/${name}`,
          name.endsWith(".json")
            ? "application/json"
            : "application/octet-stream",
        ],
      ],
    ),
  ),
};
export function createProjectServer() {
  return createServer(async (req, res) => {
    const route = routes[new URL(req.url, "http://localhost").pathname];
    if (req.method !== "GET" || !route) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    try {
      const bytes = await readFile(resolve(base, route[0]));
      res.writeHead(200, {
        "Content-Type": route[1],
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      });
      res.end(bytes);
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end(
        "Project file missing. Train and export the model, then run npm run check.",
      );
    }
  });
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const server = createProjectServer();
  server.listen(Number(process.env.PORT || 4175), "127.0.0.1", () =>
    console.log(`Project app: http://127.0.0.1:${server.address().port}`),
  );
}
