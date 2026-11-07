# Evaluation

Evaluate an exported quantized student checkpoint on the five benchmarks.
All commands run from the repository root.

## Settings

| Benchmark | Temperature | Output token limit | Interaction limit |
| --- | ---: | ---: | --- |
| BFCL V4 | 0.001 | 32,768 | Official evaluator |
| tau2-Bench | 0 | 32,768 | 200 |
| WebShop | 0.7 | 4,096 | 15 |
| ALFWorld | 0.7 | 4,096 | 50 |
| Search QA | 0.7 | 32,768 | 4 |

Search QA retrieves three passages per query. The paper uses GPT-5.6 as the
tau2 user simulator at temperature 0; record its provider/model revision
with each run. The simulator acts as part of the environment.

Python evaluators accept the exported student directory. Architecture and
tool parsers are read from the checkpoint; `--model` is the local serving name.
For W2A16 or W4A8, pass the training run's `--precision` value to
`run_benchmark.sh eval`. See [precision settings](../training/precision.md)
for runtime details and [benchmark setup](../benchmarks.md#evaluation) for
data requirements and result formats.

## Environment

Open a separate shell for direct Python evaluation, then load the environment
paths and private settings once:

```bash
source scripts/_bootstrap.sh
source scripts/lib/load_config.sh
```

## BFCL V4

Uses the official scoring categories and Overall score. Install the memory
dependencies and configure `SERPAPI_API_KEY` for web-search tasks.

```bash
"$BENCHMARK_ENV_ROOT/bin/python" -m steerdistill.benchmarks.evaluate_bfcl \
  --runtime /path/to/quantized-tool-use-checkpoint --model steerdistill \
  --output /path/to/results/bfcl_v4 --gpus 0
```

## tau2-Bench

Use the **same checkpoint as BFCL V4**. Configure `TAU2_USER_MODEL` and its API
settings in `configs/local.env`. Evaluation covers airline, retail, and telecom
with four trials per task; the user simulator is separate from the student.

```bash
"$BENCHMARK_ENV_ROOT/bin/python" -m steerdistill.benchmarks.evaluate_tau2 \
  --runtime /path/to/quantized-tool-use-checkpoint --model steerdistill \
  --output /path/to/results/tau2_bench --gpus 0
```

## WebShop

Uses the WebShop-specific checkpoint and the 500 held-out shopping goals.
The catalog, search index, JDK, and Pyserini must be installed.

```bash
"$BENCHMARK_ENV_ROOT/bin/python" -m steerdistill.benchmarks.evaluate_sdar \
  --benchmark webshop --runtime /path/to/quantized-webshop-checkpoint \
  --model steerdistill --output /path/to/results/webshop --gpus 0 --workers 4
```

## ALFWorld

Uses the ALFWorld-specific checkpoint and unseen evaluation games. Install
the game data, TextWorld, and Fast Downward planner.

```bash
"$BENCHMARK_ENV_ROOT/bin/python" -m steerdistill.benchmarks.evaluate_sdar \
  --benchmark alfworld --runtime /path/to/quantized-alfworld-checkpoint \
  --model steerdistill --output /path/to/results/alfworld --gpus 0 --workers 4
```

## Search QA

Uses the Search-QA-specific checkpoint. Start the retrieval service configured
by `SEARCH_RETRIEVER_URL` and provide all seven evaluation datasets: NQ,
TriviaQA, PopQA, HotpotQA, 2WikiMultiHopQA, MuSiQue, and Bamboogle. Results
include per-dataset exact match and their unweighted mean.

```bash
"$BENCHMARK_ENV_ROOT/bin/python" -m steerdistill.benchmarks.evaluate_sdar \
  --benchmark search_qa --runtime /path/to/quantized-search-qa-checkpoint \
  --model steerdistill --output /path/to/results/search_qa --gpus 0 --workers 4
```

## Checkpoint selection

Use a distinct output directory for each model, benchmark, and checkpoint.
To select the latest completed training checkpoint automatically, run this
alternative from a fresh shell; change the model and benchmark as needed:

```bash
bash scripts/run/run_benchmark.sh eval --model qwen3_8b --benchmark bfcl_v4
bash scripts/run/run_benchmark.sh eval --model qwen3_8b --benchmark tau2_bench
```

Set `EVAL_STEP` in `configs/local.env` to select a specific completed update.
The [all-configuration example](../benchmarks.md#running-all-configurations)
covers the 12 training runs and 15 evaluations.
