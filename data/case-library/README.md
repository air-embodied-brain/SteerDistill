# Published case evidence

19 reviewed cases: 5 training, 9 inference, and 5 autonomous recovery cases.

## Files

- `raw/` holds the sanitized publication records.
- `manifest.json` lists the distributed files, their byte sizes, SHA-256 hashes, and sanitization scope.
- `records.zip` contains the same `raw/` files and manifest.
- [index.json](index.json) maps stable slugs to displayed case codes and archive hashes.

## Sanitization

Research-machine host/user path roots are replaced with `/redacted`. Task paths, actions, tool
arguments, reasoning, outcomes, and mock benchmark account fields are preserved. Import ZIPs, SQLite
databases, transport/tokenization logs, unselected cases, and stale import checksums are excluded.
Hashes verify the sanitized public files.

## Cases

| Code | Case | Evidence | Download |
| --- | --- | --- | --- |
| T1 | 读取文件前，先确认所在目录 | [12 files](training/directory-navigation/manifest.json) | [ZIP](training/directory-navigation/records.zip) |
| T2 | 新建文件，写入第二个包含关键词的句子 | [17 files](training/create-and-write-matching-sentence/manifest.json) | [ZIP](training/create-and-write-matching-sentence/records.zip) |
| T3 | 解锁车门时，误把列表序号加进工具名 | [16 files](training/tool-list-numbering/manifest.json) | [ZIP](training/tool-list-numbering/records.zip) |
| T4 | 限制银行卡的使用范围，不能只填国家名单 | [18 files](training/card-country-restriction/manifest.json) | [ZIP](training/card-country-restriction/records.zip) |
| T5 | 创建工单前，先登录工单系统 | [35 files](training/ticket-login-before-create/manifest.json) | [ZIP](training/ticket-login-before-create/records.zip) |
| I1 | 调用 Java 工具，保留工具名与参数名的大小写 | [44 files](inference/java-node-interface/manifest.json) | [ZIP](inference/java-node-interface/records.zip) |
| I2 | 查询两项科学发现，保持工具名一致 | [44 files](inference/recipe-science-tools/manifest.json) | [ZIP](inference/recipe-science-tools/records.zip) |
| I3 | 查询导出列表，区分排序字段与方向 | [45 files](inference/export-sort-direction/manifest.json) | [ZIP](inference/export-sort-direction/records.zip) |
| I4 | 预订十一月航班，避免误读为十二月 | [45 files](inference/eleventh-month-flight/manifest.json) | [ZIP](inference/eleventh-month-flight/records.zip) |
| I5 | 查询历史舞者，避免误用馆藏工具 | [45 files](inference/dancers-not-museum-artists/manifest.json) | [ZIP](inference/dancers-not-museum-artists/records.zip) |
| I6 | 预订火车票前，先补齐出发地与目的地 | [45 files](inference/train-route-clarification/manifest.json) | [ZIP](inference/train-route-clarification/records.zip) |
| I7 | 移除自选股前，先确认公司名称 | [45 files](inference/watchlist-disambiguation/manifest.json) | [ZIP](inference/watchlist-disambiguation/records.zip) |
| I8 | 计算三个阶乘，逐项完成工具调用 | [44 files](inference/three-factorials/manifest.json) | [ZIP](inference/three-factorials/records.zip) |
| I9 | 创建三个文件后，继续写入指定内容 | [45 files](inference/files-written-before-reading/manifest.json) | [ZIP](inference/files-written-before-reading/records.zip) |
| R1 | 加油超量报错后，查询余量再补足 | [17 files](recovery/fuel-capacity/manifest.json) | [ZIP](recovery/fuel-capacity/records.zip) |
| R2 | 查询油量报错后，改正工具名再加油 | [17 files](recovery/tool-name-recovery/manifest.json) | [ZIP](recovery/tool-name-recovery/records.zip) |
| R3 | 写入报错后，先创建文件再重试 | [5 files](recovery/create-before-write/manifest.json) | [ZIP](recovery/create-before-write/records.zip) |
| R4 | 消息发送接连报错，修正参数并登录重试 | [5 files](recovery/message-session-retry/manifest.json) | [ZIP](recovery/message-session-retry/records.zip) |
| R5 | 刹车踩到一半仍无法启动，踩到底后重试成功 | [5 files](recovery/brake-pressure-retry/manifest.json) | [ZIP](recovery/brake-pressure-retry/records.zip) |

## Validation

From the repository root, run `python3 scripts/case-library.py --check`. After reviewing a changed
manifest, rebuild the deterministic ZIPs with `python3 scripts/case-library.py --package`. Run the
full publication checks with `python3 scripts/check-release.py`.
