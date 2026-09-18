# Independent project review: 10 points

A human reviewer scores five criteria from 0 to 2. Each score needs a file,
run, example or explanation as evidence. Automated artifact and split checks
support the review; they do not assign these points. Aim for at least 8/10,
with none of the blocking defects below.

| Criterion                  | 0                                                      | 1                                                                                                | 2                                                                                                                                                                        |
| -------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Problem and data           | Prediction time or label is wrong; provenance missing. | Decision, units and provenance recorded, but scope or costs need clarification.                  | Clear decision, defensible costs, attribution, time assumptions and one-room limitations.                                                                                |
| Evaluation                 | Leakage, overlap or unsupported score claims.          | Disjoint chronological periods and paired metrics, with incomplete error analysis.               | Training-only preprocessing, frozen choices, paired confusion matrices/costs, individual errors and an honest treatment of repeated test access.                         |
| Modeling judgment          | Uses a model without a baseline or rationale.          | Baseline and model compared, with a partly justified choice.                                     | Defends features, capacity and threshold from validation evidence; can retain a winning baseline and reconsider under changed costs.                                     |
| Implementation             | Clean download cannot predict outside Tensorcraft.     | Clean setup, saved weights and preprocessing work, but parity or failure handling is incomplete. | Clean installation reproduces runs; actual browser scores match; malformed inputs and missing/corrupt artifacts fail clearly; versions and operating notes are recorded. |
| Explanation and adaptation | Cannot explain the work or assistance is omitted.      | Can explain major choices and records help, but adaptation is incomplete.                        | Explains a mistake, makes the changed-cost adaptation, states what new test evidence is needed, and records effort/help.                                                 |

Blocking defects: outcome information used as an input; preprocessing fitted
on held-out data; model selection using the reported final period without
disclosure/new evaluation; baseline/model scores from different rows;
non-reproducible or fabricated metrics; or no working external inference.
Any blocker prevents a pass regardless of the sum.

An assisted implementation can be reviewed. Record the assistance and ask the
learner to explain a failure and make a fresh change. Do not label assisted
completion as unaided mastery. Do not require the model to beat a rule.

## Reviewer procedure

1. Obtain the complete project folder. Read the declared choices before
   looking at scores. Check split IDs and preprocessing/training code.
2. Install from the lockfile in a clean folder. Reproduce training/evaluation,
   retaining the original result for comparison. Random training may vary;
   verify the method and discuss differences rather than requiring one score.
3. Run artifact checks and three raw-row predictions in the browser. Inspect
   the missing/corrupt-artifact response and source attribution.
4. Ask why the chosen metric follows from the decision, then change one cost.
   Ask for an adaptation and what that does to the status of the test period.
5. Record five scores, blockers, feedback, date, active time, assistance and
   evidence paths. Do not infer a delayed result from today's work.

Seven days later, use a fresh unseen period or suitable new dataset to assess
transfer. Record what the learner can do without reopening their report, what
help they use and which earlier errors recur. Learner recruitment, independent
review and delayed outcomes remain separate work; this rubric is not evidence
that any of those activities have happened.
