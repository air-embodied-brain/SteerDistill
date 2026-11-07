# SteerDistill

**Quantizing LLM Agents via Closed-Loop Teacher Steering**

[Website and cases](https://air-embodied-brain.github.io/SteerDistill/) · [Quickstart](#quickstart-qwen3-8b-on-bfcl-v4) · [Training](docs/training/README.md) · [Evaluation](docs/evaluation/README.md) · [For agents](#for-agents)

**Paper:** [arXiv:2611.13410](https://arxiv.org/abs/2611.13410) · **Checkpoints:** TODO (download links)

Quantization can cause LLM agents to overlook task requirements and environment
conditions. SteerDistill helps the quantized student correct these mistakes in
its own failure contexts, then internalizes the corrections for independent
use at inference time.

1. **Closed-loop teacher steering.** The student retries a divergent turn from
   the pre-error history and environment state. A frozen teacher refines its
   guidance using execution feedback until the correction passes local verification.
2. **Internalization.** The learner trains without guidance, matching the steered
   student's predictions at corrected turns and the BF16 teacher's predictions
   elsewhere. Locally verified corrections are retained even when the task
   remains unsolved.

The pipeline starts from task-specific, post-RL BF16 checkpoints and covers data
preparation, clipping calibration, quantized model export, online distillation,
and evaluation.

## Models and benchmarks

| Model | Precision | Training guide |
| --- | --- | --- |
| Qwen3-8B | W4A16, W4A8, W2A16 | [Qwen3-8B](docs/training/README.md#qwen3-8b) |
| Qwen3.5-4B | W4A16 | [Qwen3.5-4B](docs/training/README.md#qwen35-4b) |
| Gemma 4 12B-it | W4A16 | [Gemma 4](docs/training/README.md#gemma-4-12b-it) |

The five benchmarks are BFCL V4, tau2-Bench, WebShop, ALFWorld, and Search QA.
For each model, BFCL V4 and tau2-Bench share one tool-use checkpoint and training
run. WebShop, ALFWorld, and Search QA each use a task-specific checkpoint.
[Model and data setup](docs/benchmarks.md) lists checkpoint paths, data sources,
and environment requirements; the [precision guide](docs/training/precision.md)
describes the quantization schemes and runtime backends.

## Requirements

- Linux, Bash, and NVIDIA GPUs. The reference training setup uses eight A100 80GB GPUs.
- Python 3.10 for training, with [pinned dependencies](requirements/training.lock).
- Separate inference and benchmark environments; the tool-use adapter uses Python 3.12.
- vLLM with support for the selected model architecture and quantized kernels.

See [environment setup](docs/reproducibility.md) for versions, CUDA configuration,
and external source revisions.

## Setup

### Install

```bash
git clone https://github.com/air-embodied-brain/SteerDistill.git
cd SteerDistill

python3.10 -m venv .venv
.venv/bin/python -m pip install torch==2.7.1 --index-url https://download.pytorch.org/whl/cu126
.venv/bin/python -m pip install -r requirements/training.lock
.venv/bin/python -m pip install --no-deps -e .
```

Prepare the inference, benchmark, and tool-adapter environments following
[environment setup](docs/reproducibility.md).

### Configure

```bash
cp configs/local.example.env configs/local.env
chmod 600 configs/local.env
```

Set checkpoint, data, environment, GPU, and API settings in `configs/local.env`.
Launchers load this file automatically. The default route is Qwen3-8B with
BFCL V4. See [local configuration](docs/benchmarks.md#local-configuration)
for overrides and [checkpoints](docs/benchmarks.md#checkpoints) for model inputs.

### Check prerequisites

```bash
bash scripts/validate/preflight.sh
```

## Quickstart: Qwen3-8B on BFCL V4

Prepare the [tool-use training inputs](docs/benchmarks.md#tool-use-training),
set `QWEN3_8B_TOOL_USE_MODEL` in `configs/local.env` to the post-RL BF16
checkpoint, and configure `SERPAPI_API_KEY` for web-search evaluation. Then run:

```bash
bash scripts/run/run_benchmark.sh full --model qwen3_8b --benchmark bfcl_v4
```

This checks prerequisites, prepares calibration data, calibrates clipping,
exports the quantized student, runs online training, and evaluates the latest
completed checkpoint. Outputs go to
`$STEER_ASSET_ROOT/runs/qwen3_8b/bfcl_v4/`.

## Documentation

| Guide | Contents |
| --- | --- |
| [Data preparation](docs/data/README.md) | Training inputs and calibration preprocessing |
| [Quantization and training](docs/training/README.md) | Model-specific commands and training outputs |
| [Evaluation](docs/evaluation/README.md) | Benchmark protocols and checkpoint selection |

## For agents

Read [the agent guide](docs/agents.md) for the paper-to-code map, configuration
rules, expected artifacts, and a minimal run sequence. It also explains internal
names such as `skill`, which refers to a stored steering prompt.

## Citation

If you use SteerDistill, please cite our paper:

```bibtex
@misc{cui2026steerdistill,
  title = {{SteerDistill}: Quantizing {LLM} Agents via Closed-Loop Teacher Steering},
  author = {Genming Cui and Xiangyu Li and Zixu Hao and Xin Ding
            and Yunxin Liu and Ting Cao},
  year = {2026},
  eprint = {2611.13410},
  archivePrefix = {arXiv},
  primaryClass = {cs.AI},
  doi = {10.48550/arXiv.2611.13410},
  url = {https://arxiv.org/abs/2611.13410}
}
```

Download [CITATION.bib](CITATION.bib); structured citation metadata are in
[CITATION.cff](CITATION.cff).

## Acknowledgments and license

We thank the authors of BitDistiller, the benchmark environments, and the
inference libraries used by this project. See [third-party notices](docs/third_party_notices.md)
for attribution and component terms.

SteerDistill uses the [MIT License](LICENSE), with Apache-2.0 terms for
incorporated GPTQ-triton material. Models and datasets retain their providers' licenses.
