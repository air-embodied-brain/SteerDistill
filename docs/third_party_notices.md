# Third-party notices

This release includes SteerDistill's training, quantization, and environment
integration code. Models, datasets, vLLM, and benchmark environments are installed
from their respective providers.

The following projects are used or referenced by the route. Their licenses
and citation requirements must be preserved when the corresponding external
source is downloaded.

| Component | License / notice | Source |
| --- | --- | --- |
| BitDistiller base code | MIT; see upstream `LICENSE` | [Source](https://github.com/DD-DuDa/BitDistiller) |
| Tool-use environment adapter | See upstream repository and dataset terms | [Source](https://github.com/Snowflake-Labs/agent-world-model) |
| Tool-use trajectory dataset | See Hugging Face dataset card | [Source](https://huggingface.co/datasets/Snowflake/AgentWorldModel-1K) |
| Qwen3-8B base model | See the Hugging Face model card and license | [Source](https://huggingface.co/Qwen/Qwen3-8B) |
| Qwen3.5-4B base model | See the Hugging Face model card and license | [Source](https://huggingface.co/Qwen/Qwen3.5-4B) |
| Gemma 4 12B-it base model | See the Hugging Face model card and Gemma license; weights are not redistributed | [Source](https://huggingface.co/google/gemma-4-12B-it) |
| SDAR environment integrations | Preserve upstream licenses and embedded component notices | [Source](https://github.com/ZJU-REAL/SDAR) |
| BFCL | Apache-2.0; upstream license and benchmark terms | [Source](https://github.com/ShishirPatil/gorilla/tree/main/berkeley-function-call-leaderboard) |
| tau2-bench | MIT; upstream license and data terms | [Source](https://github.com/sierra-research/tau2-bench) |
| WebShop | Upstream code license and product-data terms | [Source](https://github.com/princeton-nlp/WebShop) |
| ALFWorld / TextWorld | Upstream licenses and game-data terms | [Source](https://github.com/alfworld/alfworld) |
| Search-R1 | Upstream license, source dataset terms, and retrieval corpus terms | [Source](https://github.com/PeterGriffinJin/Search-R1) |
| AutoAWQ reference | MIT; upstream `LICENSE` | [Source](https://github.com/casper-hansen/AutoAWQ) |
| GPTQ-triton reference | Apache-2.0; full text in `licenses/GPTQ-triton-LICENSE` | [Source](https://github.com/fpgaminer/GPTQ-triton) |
| Triton | See the installed package license | [Source](https://github.com/triton-lang/triton) |
| vLLM | Apache-2.0; see the installed package license | [Source](https://github.com/vllm-project/vllm) |
| Transformers | Apache-2.0; see the installed package license | [Source](https://github.com/huggingface/transformers) |
| Flash Linear Attention | See the pinned package's upstream license | [Source](https://github.com/fla-org/flash-linear-attention) |

Redistributed external source, model, or data files retain their upstream
licenses and notices.

The quantization kernels include adapted code attributed to Vedant Roy and
reference GPTQ-triton. Their original source notices are retained; the root
MIT license does not replace the Apache-2.0 terms for incorporated
GPTQ-triton material. Benchmark-specific data terms must be checked when
downloading assets.
