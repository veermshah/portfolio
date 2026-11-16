# Live model attempt log

All attempts use actual CPU Qwen3 inference, not offline policies. Attempts 1–3
use 0.6B Q4_K_M; attempt 4 uses 1.7B Q4_K_M.

1. `output-live-attempt1/`: three calls completed. Prompt included schema example
   placeholders; model copied placeholders in two responses and misattributed a
   grace-period decision to line 2 in the third. 0 grouped disagreements. This is
   a failed interpretation-quality run, not successful ambiguity discovery.
   Total provider tokens: 1025. Max queue-inclusive latency: 20.373 seconds.
2. Prompt revised to specify source-line/topic slots without supplying any
   implementation assumption; role-specific engineering priorities added. Three
   calls submitted, but constrained JSON inference stalled and blocked the shared
   inference queue. The runtime was interrupted and restarted without grammar.
   No completed response set or successful measurement is claimed for attempt 2.
3. Unconstrained Qwen3-0.6B CPU run: all three responses completed (max
   queue-inclusive latency 97.843 seconds), preserved in `output-live-attempt3/`.
   Responses used nested model-field objects rather than requested field lists;
   some endpoints contained decisions instead of API sketches. Strict schema
   validation failed. Many assumptions paraphrased the spec without choosing a
   concrete policy, so textual differences would not demonstrate genuine
   ambiguity discovery even if the schema were relaxed. No manual repair used.
4. **Successful three-call run:** `output-live-1.7b/`, Qwen3-1.7B Q4_K_M,
   CPU, 1 thread, no JSON grammar. Full prompts and unmodified completions are
   bundled. 6 source-line/topic flags (5 unique topics), including four clearly
   conflicting policy decisions discussed in the README. Total provider tokens
   2876 (1444 input, 1432 output), longest queue-inclusive response 183.033s.
   No response repair, authored assumptions, or automatic retry was used.
