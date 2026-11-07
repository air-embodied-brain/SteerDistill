# Running and modifying SteerDistill

Run commands from the repository root. Start with Qwen3-8B, BFCL V4, W4A16;
this uses the default route and the paper's primary precision. Use Linux with
NVIDIA GPUs for training and inference. CPU tests validate contracts, not a
complete GPU training run.

## Paper-to-code map

| Paper concept | Implementation entry |
| --- | --- |
| Frozen BF16 teacher and quantized student from one post-RL checkpoint | `configs/benchmark-paths.example.env`, `scripts/prepare/` |
| Online rollout, reference collection, and revision orchestration | `src/steerdistill/online.py`, `src/steerdistill/stream_repair.py` |
| Divergence alignment and environment-transition verification | `src/steerdistill/transition_policy.py`, `src/steerdistill/transition_verifier.py` |
| Teacher steering prompt and feedback | `src/steerdistill/analysis.py`, `src/steerdistill/teacher/`, `src/steerdistill/counterfactuals.py` |
| Retained corrected turns and unsteered continuations | `src/steerdistill/materialize.py` |
| Unsteered learner; corrected-turn FKL and other-turn RKL | `src/steerdistill/training/data_loading.py`, `src/steerdistill/training/mytrainer.py` |
| Trajectory batches and token-normalized updates | `src/steerdistill/training/online_step.py` |
| Standalone student evaluation | `scripts/run/evaluate.sh`, `src/steerdistill/benchmarks/` |

Some internal names predate the paper terminology. A `skill` is a stored
steering prompt and its revision/verification metadata. `skill_recovery` and
`steer_forward` distillation modes select the steered frozen-student target. The
ordinary mode selects the BF16 teacher target. Compatibility and ablation
paths such as teacher rescue are not the default paper method. Do not enable
them merely because their names occur in the source.

The teacher stays frozen. Each cycle's rollout/revision snapshot is also
frozen; the learner uses fake quantization with trainable BF16 master weights.
Steering is supplied to the corrected-turn target, never to the learner.
Accepted local corrections are retained even without terminal task success;
discarded failed responses and old suffixes must not return as targets.
Continue after an accepted correction without guidance. At evaluation, load
only the exported student; the tau2 user simulator is an environment actor,
not the distillation teacher.

## Configure and run one route

1. Install the separate training, inference, benchmark, and tool-adapter
   environments from [reproducibility.md](reproducibility.md).
2. Copy `configs/local.example.env` to `configs/local.env`. It is trusted Bash,
   not a dotenv file. Put overrides above its final `source` command. Keep
   private keys there; do not edit tracked templates to configure a machine.
3. Supply the post-RL checkpoint, executable task manifest, environment tables,
   and calibration records listed in [model and data setup](benchmarks.md).
   Use the task-specific post-RL checkpoint for the paper's initialization.
4. Run:

```bash
bash scripts/validate/preflight.sh
bash scripts/run/run_benchmark.sh quantize --model qwen3_8b --benchmark bfcl_v4
bash scripts/run/run_benchmark.sh train --model qwen3_8b --benchmark bfcl_v4
bash scripts/run/run_benchmark.sh eval --model qwen3_8b --benchmark bfcl_v4
```

`prepare` stops at clipping; `quantize` also exports the runtime. `train`
prepares missing initial quantization artifacts and starts online updates.
`full` performs preflight, quantization, training, and evaluation. Successful
preflight is necessary, but does not demonstrate end-to-end execution.

The paper defaults are group size 64, two epochs, learning rate `8e-6`,
16 complete trajectories per update, and four steering attempts per
intervention. One-turn microbatches bound memory; they do not change the
trajectory batch definition. Context/output limits and evaluator settings are
listed in [evaluation](evaluation/README.md).

BFCL V4 and tau2-Bench share the tool-use checkpoint and training run.
Evaluate tau2 after BFCL training; do not train an independent tau2 model.
WebShop, ALFWorld, and Search QA require separate task-specific checkpoints.
Keep `--precision` identical across quantization, training, and evaluation.
W2A16/W4A8's reference backend implements the numerical scheme; it does not
demonstrate fused low-bit GEMM speedups.

## Outputs and diagnosis

Generated assets live under `STEER_ASSET_ROOT`, outside the checkout. Defaults
for W4A16 use `runs/<model>/<benchmark>/`; other precisions append their key.
tau2 reads the BFCL training run and writes its own evaluation directory.
See [training outputs](training/README.md#outputs) for the directory map.

Use `online/latest.json` and the checkpoint resolver to select completed
updates; do not guess the latest checkpoint by sorting directory names.
Preserve optimizer state, clipping provenance, run manifests, and the snapshot
used to generate targets when resuming. When preflight fails, resolve the
reported missing input or capability before launching a long job. Do not
replace execution-based local verification with text equality, trust a
model's success claim, or mix artifacts from different precisions.

## Before changing the implementation

```bash
PYTHONDONTWRITEBYTECODE=1 python -B -m unittest discover -s tests -v
```

Run this in the installed training environment. External-runtime checks are
opt-in; skipped GPU/benchmark checks are not successful integration runs.
Relevant existing tests cover transition verification, retained data,
generation budgets, KL routing, optimizer continuation, and benchmark routes.
The release archive check is described in [reproducibility.md](reproducibility.md#source-archives).
