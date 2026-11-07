# Data preparation

Prepare training tasks and calibration records after installing the
[benchmark environments](../benchmarks.md#data-and-environment-downloads).
Run commands from the repository root.

## Tool-use tasks

BFCL V4 and tau2-Bench share the tool-use training records, executable prompt
manifest, and environment tables described in
[tool-use training](../benchmarks.md#tool-use-training). tau2 evaluation uses
its official environment.

## Native environment tasks

Export WebShop, ALFWorld, and Search QA tasks from their training environments.
Search QA uses NQ and HotpotQA training records. Each export is shared by all
three models.

```bash
(
  set -e
  source scripts/_bootstrap.sh
  source scripts/lib/load_config.sh

  "$BENCHMARK_ENV_ROOT/bin/python" -m steerdistill.benchmarks.prepare_sdar_tasks \
    --benchmark webshop --split train --output "$WEBSHOP_RL_TRAIN_DATA"
  "$BENCHMARK_ENV_ROOT/bin/python" -m steerdistill.benchmarks.prepare_sdar_tasks \
    --benchmark alfworld --split train --output "$ALFWORLD_RL_TRAIN_DATA"
  "$BENCHMARK_ENV_ROOT/bin/python" -m steerdistill.benchmarks.prepare_sdar_tasks \
    --benchmark search_qa --split train --output "$SEARCH_QA_RL_TRAIN_DATA"
)
```

Run only the exports needed for your benchmarks. The parentheses keep these
configuration variables out of the shell used to launch different training routes.
The quantization launcher also generates missing native training records.

## Calibration records

Calibration records are normalized and deduplicated automatically before
clipping. To inspect this preprocessing independently:

```bash
.venv/bin/python -m steerdistill.benchmarks.prepare_data \
  --input /path/to/rl_train.jsonl \
  --output /path/to/prepared/calibration.jsonl
```
