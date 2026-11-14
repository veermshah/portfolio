---
title: "When feedback doesn’t teach a network"
description: "What the DishBrain Playground experiments show about feedback timing, controls, and reporting null results."
date: "2026-11-14"
---

[DishBrain Playground](/projects/dishbrain-playground/) puts 1,000 simulated spiking neurons on a virtual electrode array and connects them to Pong. The central question is whether a generic network with spike-timing-dependent plasticity can learn from the feedback protocol used in the DishBrain paper.

## The initial result was a null

Across 12 paired seeds and 20 simulated minutes per seed, the paper-inspired protocol produced no learning. Rally length remained near 0.3 hits per rally, similar to the control with plasticity disabled. The comparison against silent feedback gave p = 0.30.

STDP links spikes roughly 20 milliseconds apart. Feedback arriving seconds later, independently of what the network is doing at that moment, leaves a difficult credit-assignment problem.

This simulation does not establish what happens in a living neuronal culture. It tests a particular mechanism in a particular model.

## A different feedback loop

A second condition used stimulation avoidance: stimulation stopped within one millisecond when the paddle steered toward the ball. After tuning on separate development seeds, the experiment used held-out seeds to evaluate it.

The intended sensory-to-motor mapping formed, and late rallies beat the STDP-off control on 10 of 12 seeds. The median late rally was about 0.56 hits, compared with roughly 0.35 in the control (p = 0.002). That is a measurable but modest improvement.

Reward-modulated STDP did not beat its shuffled-reward control (p = 0.53). Reporting that result alongside the successful condition matters: adding a reward signal is not by itself evidence that a learning mechanism works.

## Keep the controls close

A visually convincing demo is a useful way to explore a model. Paired seeds, ablations, held-out evaluation, and effect sizes are what make its learning claims assessable.

[Explore the project and its results](/projects/dishbrain-playground/) or [read the source](https://github.com/veermshah/dishbrain-playground).
