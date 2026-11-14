---
title: "Making LLM costs a compiler contract"
description: "How Veer uses linear contexts and static analysis to put memory and accuracy budgets in the program."
date: "2026-11-14"
---

An LLM program can be correct and still be too expensive to run. Growing a context, branching a conversation, or editing its history changes how much memory and computation the inference engine needs.

[Veer](/projects/veer/) makes those costs part of the language. A context is a linear value: operations consume it and return a new one. That gives the compiler a precise account of which contexts are alive, instead of relying on an informal convention about ownership.

## Budgets before execution

The static planner interprets operations over paged KV-cache segments. It computes upper bounds on peak KV memory, prefill and decode tokens, context length, and the cost of re-prefilling after a splice.

A program can declare a contract such as `@budget(kv = 2GiB, prefill = 12000)`. The compiler checks the contract before execution. This makes resource limits something a reviewer can inspect alongside the program.

## Accuracy is a separate contract

Quantization creates another budget: numeric error. Veer’s precision types propagate error bounds through quantization, matrix multiplication, and activations, including FP8, INT8, MXFP4, and NVFP4. An `@accuracy(rel <= 0.25)` contract asks the compiler to check that bound as well.

These guarantees apply to the compiler’s model and error algebra. They are not a claim that every possible inference backend will have identical timing or that numeric error bounds measure an answer’s usefulness.

The useful distinction is between a cost the program can establish in advance and behavior that still needs measurement. Both belong in the engineering process.

[Read the project write-up](/projects/veer/) or [browse the compiler source](https://github.com/veermshah/veer).
