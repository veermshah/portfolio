# Fog Map ambiguity report

Live api: three independent model requests

Severity = differing agent pairs (0–3) × maximum impact (1–3). Textual comparison; semantically equivalent phrasing can be overflagged.

## Full interpretations

### backend engineer
```json
{
  "data_model": {
    "Entity": [
      "user",
      "habit",
      "streak",
      "team",
      "check_in"
    ]
  },
  "endpoints": [
    {
      "METHOD": "/api/habit",
      "path": "/api/habit"
    }
  ],
  "decisions": [
    {
      "line": 2,
      "topic": "short canonical topic",
      "impact": 1,
      "assumption": "concrete choice"
    }
  ],
  "persona": "backend engineer",
  "provider_evidence": {
    "model": "Qwen3-0.6B-Q4_K_M",
    "usage": {
      "prompt_tokens": 265,
      "completion_tokens": 81,
      "total_tokens": 346
    },
    "elapsed_seconds": 13.064,
    "raw_content": "{\"data_model\": {\"Entity\": [\"user\", \"habit\", \"streak\", \"team\", \"check_in\"]}, \"endpoints\": [{\"METHOD\": \"/api/habit\", \"path\": \"/api/habit\"}], \"decisions\": [{\"line\": 2, \"topic\": \"short canonical topic\", \"impact\": 1, \"assumption\": \"concrete choice\"}] }"
  }
}
```

### frontend engineer
```json
{
  "data_model": {
    "Entity": [
      "habit",
      "team",
      "streak"
    ]
  },
  "endpoints": [
    {
      "METHOD": "/api/v1/habit",
      "endpoints": [
        "create",
        "read",
        "update",
        "delete"
      ]
    }
  ],
  "decisions": [
    {
      "line": 2,
      "topic": "missed-day grace",
      "impact": 1,
      "assumption": "a grace period of 24 hours is allowed for missed days"
    }
  ],
  "persona": "frontend engineer",
  "provider_evidence": {
    "model": "Qwen3-0.6B-Q4_K_M",
    "usage": {
      "prompt_tokens": 265,
      "completion_tokens": 94,
      "total_tokens": 359
    },
    "elapsed_seconds": 20.373,
    "raw_content": "{\"data_model\": {\"Entity\": [\"habit\", \"team\", \"streak\"]}, \"endpoints\": [{\"METHOD\": \"/api/v1/habit\", \"endpoints\": [\"create\", \"read\", \"update\", \"delete\"]}], \"decisions\": [{\"line\": 2, \"topic\": \"missed-day grace\", \"impact\": 1, \"assumption\": \"a grace period of 24 hours is allowed for missed days\"}]}"
  }
}
```

### QA engineer
```json
{
  "data_model": {
    "Entity": [
      "field"
    ]
  },
  "endpoints": [
    "METHOD /path"
  ],
  "decisions": [
    {
      "line": 2,
      "topic": "short canonical topic",
      "impact": 1,
      "assumption": "concrete choice"
    }
  ],
  "persona": "QA engineer",
  "provider_evidence": {
    "model": "Qwen3-0.6B-Q4_K_M",
    "usage": {
      "prompt_tokens": 265,
      "completion_tokens": 55,
      "total_tokens": 320
    },
    "elapsed_seconds": 6.311,
    "raw_content": "{\"data_model\": {\"Entity\": [\"field\"]}, \"endpoints\": [\"METHOD /path\"], \"decisions\": [{\"line\": 2, \"topic\": \"short canonical topic\", \"impact\": 1, \"assumption\": \"concrete choice\"}]}"
  }
}
```
