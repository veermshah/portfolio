# Actual model measurements

Single queried variable; all four levels. Invalid model JSON is incorrect. Transport/context errors are counted separately and excluded from valid accuracy.

|Model|Method|Assignments|Correct / valid|Errors|Calls|Input tokens|Output tokens|Seconds|
|---|---|---:|---:|---:|---:|---:|---:|---:|
|Qwen3-0.6B-Q4_K_M|model-scratchpad|8|2 / 4|0|4|1007|128|99.7|
|Qwen3-0.6B-Q4_K_M|model-scratchpad|32|0 / 4|0|12|3176|443|276.0|
|Qwen3-0.6B-Q4_K_M|model-scratchpad|128|0 / 4|0|36|9420|1044|857.3|
|Qwen3-0.6B-Q4_K_M|model-tool|8|0 / 4|0|5|935|149|141.8|
|Qwen3-0.6B-Q4_K_M|model-tool|32|1 / 4|0|6|1785|103|88.8|
|Qwen3-0.6B-Q4_K_M|model-tool|128|0 / 4|0|5|4090|146|176.3|
|Qwen3-0.6B-Q4_K_M|raw|8|3 / 4|0|4|809|29|87.2|
|Qwen3-0.6B-Q4_K_M|raw|32|1 / 4|0|4|1431|29|108.0|
|Qwen3-0.6B-Q4_K_M|raw|128|0 / 4|0|4|3968|30|120.4|
