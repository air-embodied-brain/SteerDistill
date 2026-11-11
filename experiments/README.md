# Website chart inputs

The homepage and article share these numerical inputs:

- [benchmark_results.csv](data/benchmark_results.csv): the paper's 33 model/precision/method rows, also offered as a download.
- [efficiency.json](data/efficiency.json): Fig. 3 training GPU hours, means and standard deviations, and inference token counts for Qwen3-8B W4A16 on τ²-Bench.

## Metrics

Scores are percentages. The average is the unweighted mean of the five benchmark scores. `Ours` is
SteerDistill. The files contain the published website snapshot; they are maintained separately from the manuscript.


## Pending manuscript synchronization

The 2026-11-10 manuscript revision updated the Qwen3-8B W4A16 BFCL means.
The website CSV still contains the earlier values:

| Method | Website BFCL / average | Revised manuscript BFCL / average |
| --- | --- | --- |
| On-Policy QAD | 44.43 / 50.38 | 44.53 / 50.40 |
| QeRL | 44.91 / 51.00 | 44.95 / 51.01 |
| SteerDistill | 46.84 / 53.18 | 46.87 / 53.19 |

Update the CSV and both article languages together when synchronizing results.
The efficiency JSON is unchanged by this BFCL revision.
