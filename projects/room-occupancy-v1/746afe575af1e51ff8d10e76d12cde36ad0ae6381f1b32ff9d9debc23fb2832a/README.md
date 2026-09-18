# Maintainer verification fixture

Published to verify Tensorcraft project export. This is an infrastructure test, not a learner submission, independent score, production model or recommended solution.

# Room occupancy: independent ML project

A facilities team wants a review-only display of whether one office is
occupied, using measurements available at that moment. Your job is to compare
a simple baseline with a trained classifier and recommend which to keep.
Do not connect this experiment to access controls or building equipment.

You choose features, periods, model, threshold and error costs. The supplied
code handles file export, reload, metric arithmetic and the browser app. The
training experiment is yours. Budget 4 to 8 hours initially; that estimate
has not been tested with learners. An ordinary laptop and Node.js 22+ suffice.

## Start in a clean folder

Extract the download, open a terminal in it, then run:

```sh
npm ci
npm run train
```

The untouched starter prints the row count and asks you to implement the
experiment. There are no supplied weights or model solution. Edit `train.mjs`
and `plan.json`, following the steps below. Keep `package-lock.json` with your
work. After the initial dependency installation, all commands and the app
use local files and need no Tensorcraft login, API key or paid service.

## Data and scope

`data.json` contains 2,056 measurements derived from the UCI Occupancy
Detection dataset. They describe one room, with binary occupancy labels.
They are real recorded measurements, not synthetic ship signals. See
[DATA-LICENSE.md](DATA-LICENSE.md) for attribution and transformation details.

| Field           | Meaning and use                                                                                       |
| --------------- | ----------------------------------------------------------------------------------------------------- |
| `id`            | Original filename and row number; metadata, never a model feature.                                    |
| `recordedAt`    | Source wall-clock timestamp. Its timezone is unspecified. Use it to order periods; do not assume UTC. |
| `temperature`   | Celsius.                                                                                              |
| `humidity`      | Relative humidity in percent.                                                                         |
| `light`         | Illuminance in lux.                                                                                   |
| `co2`           | Carbon dioxide in ppm.                                                                                |
| `humidityRatio` | Water-vapor mass per air mass.                                                                        |
| `occupied`      | Target: 1 occupied, 0 unoccupied. Never an input.                                                     |

The original files have training/test names, but this package combines and
sorts them before sampling. Choose your own chronological periods from the
combined rows. Nearby measurements are related, so random rows from the same
hours are weak evidence of performance on future periods. One room does not
establish transfer to other buildings. Do not infer identities or headcounts.

## Make and record the decisions

1. Define what a flag changes and assign explicit costs to false positives
   (empty room flagged occupied) and false negatives (occupied room missed).
   These costs are your operating assumptions, not facts supplied by UCI.
2. Put row IDs into `split.train`, `split.validation` and `split.test` in
   `plan.json`. Use ordered, disjoint periods. You may leave gaps and unused
   rows. Explain the boundaries and check both classes have enough examples.
3. Fit preprocessing only on training rows. Record those IDs in
   `preprocessingFitIds`. Choose from the five numeric measurements above;
   report feature order, means and positive standard deviations. For a
   constant training feature, drop it or use scale 1 and explain why.
4. Choose a simple baseline using training and validation data. The evaluator
   supports `{ "kind": "constant", "value": 0 }` (or 1), or
   `{ "kind": "threshold", "feature": "light", "threshold": 123,
"direction": "gte" }` (`lte` is also supported). The number 123 is a
   format example, not a recommended cutoff. Extend `evaluation.mjs` if your
   justified baseline needs a different form and document the change.
5. Write a small TFJS Layers model with one scalar score in [0, 1]. Choose the
   architecture and fitting settings. Use the exported `vectorFor` helper to
   transform rows identically during training and browser inference.
6. Call `saveArtifact(model, metadata, rawRows)` after fitting. Metadata has
   `{version: 1, features, mean, std, threshold}`. Supply at least three varied
   raw rows from the training/validation periods for reload comparisons.
7. Run `npm run check`, then `npm run evaluate -- validation`. The evaluator
   loads your actual saved model, compares both policies on the same IDs and
   records confusion matrices, costs and predictions in a new `runs/` file.
   Fix implementation problems and make modeling choices using this period.
8. Freeze your choices, then run `npm run evaluate -- test` once. Keep the run,
   inspect mistakes and recommend the model or baseline. A rule that wins is
   a valid result. Changing choices after inspecting this period means it
   becomes development data; you need new data for an independent test.

The validator can detect overlapping IDs and recompute scores. It cannot
prove which rows you actually used to fit scaling, whether you peeked at the
final period, or whether your explanation is sound. Those need code review.
Undefined precision/recall is reported as null, rather than a measured zero.

## Run the exported application

```sh
npm run check
npm start
```

Open `http://127.0.0.1:4175`. Enter three raw examples from `model/parity.json`
and compare scores with that file (absolute tolerance 1e-5). This browser uses
installed TFJS and the files in `model/`; it has no hidden exercise variables.
It reports its backend and inference/readback time. Record first-call timing
separately from repeated calls; report the device and repeat count.

Try a blank input, a non-finite/oversized value and a missing artifact. Rename
`model/weights.bin`, reload, observe the unavailable state, then restore it.
Change a copied artifact byte and check that checksum verification refuses
it. Hashes detect accidental mismatches; they do not prove authenticity.

## Adapt and explain

Complete `report.md` and use `RUBRIC.md` for review. Include individual error
IDs, a model card and a short operational runbook. State the label meaning,
feature units, training periods, limitations and the intended decision.
Keep the model even if you recommend the baseline, so export can be reviewed.

For the adaptation, double your assumed false-negative cost. Reconsider
threshold and policy on validation data, retain the first artifact/report,
and document the change. The old test results are now known; say which new
period you would need for an independent evaluation. For a delayed attempt,
a reviewer supplies a fresh period or dataset, not a relabeled copy of this
already inspected test set.

## Share your own work

Keep this folder with your experiment, plan, report, `model/` files and all
`runs/` records. Exclude `node_modules/`. Zip it for a reviewer, or create your
own GitHub repository and upload the folder. The supplied `.gitignore` keeps
installed dependencies out of Git. Do not include credentials or private data.

In the course's independent-project panel, choose your completed folder, then
preview the GitHub destination. Publishing uses your existing
`tensorcraft-deep-orbit` repository and shows its visibility before you confirm.
It includes the supplied project files, `model/` artifacts, validation/test
JSON runs and optional flat `src/*.js`, `src/*.mjs` or `src/*.json` helpers.
Other files, including dependencies, Git metadata and `.env`, are excluded.
Inspect the file list and your own code/report before publishing. The limit
is 100 included files and 4 MiB; use a manual upload if your project needs more.

Each changed selection creates a separate snapshot under
`projects/room-occupancy-v1/`. Repeating the same export reuses that snapshot.
Earlier snapshots and exercise files remain available. GitHub permissions or
branch protection may prevent export; the UI reports failure so you can fix
access or share a ZIP. Publishing does not assign a rubric score.

Give your reviewer the snapshot link, not just the repository home page.
A reviewer must be able to extract or clone it, run `npm ci`, reproduce the
experiment, check the artifact and open the app without your browser session.
For a clone, enter the snapshot folder before running those commands.

Hosting is optional. For a static host, copy the browser files, model files
and the installed TFJS bundle, keeping the URL paths used by `app.mjs`.
If you host below a path prefix, adapt those paths and test failed downloads.
Do not advertise a deployment until you have checked that hosted version.
