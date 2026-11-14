# Fog Map ambiguity report

OFFLINE RULES DEMO — no LLM calls or independent model evidence

Severity = differing agent pairs (0–3) × maximum impact (1–3). Textual comparison; semantically equivalent phrasing can be overflagged.

## 1. team habit ownership — severity 9/9
Line 2: Build a habit-tracking app with streaks and teams.

- **backend engineer:** shared team habit with individual check-ins
- **frontend engineer:** one collective team completion
- **QA engineer:** copied personal habits with aggregate progress

## 2. day boundary — severity 9/9
Line 3: Users can complete each habit daily and keep their streak alive.

- **backend engineer:** UTC calendar day
- **frontend engineer:** user local calendar day
- **QA engineer:** rolling 24-hour window

## 3. missed-day grace — severity 9/9
Line 4: A missed day can be forgiven with a grace period.

- **backend engineer:** 24 hours after deadline
- **frontend engineer:** one forgiveness token per week
- **QA engineer:** no reset until 48 hours of inactivity

## 4. team habit ownership — severity 9/9
Line 5: Team members share habits and see team progress.

- **backend engineer:** shared team habit with individual check-ins
- **frontend engineer:** one collective team completion
- **QA engineer:** copied personal habits with aggregate progress

## 5. historical edits — severity 9/9
Line 6: Users should be able to edit past check-ins.

- **backend engineer:** edits recalculate all subsequent streaks
- **frontend engineer:** edits change calendar display only
- **QA engineer:** edits restricted to previous seven days

## 6. notification delivery — severity 6/9
Line 7: Notify people when their streak is at risk.

- **backend engineer:** email at 20:00 UTC
- **frontend engineer:** in-app banner at local 20:00
- **QA engineer:** push two hours before each personal deadline

## Full interpretations

### backend engineer
```json
{
  "persona": "backend engineer",
  "data_model": {
    "Habit": [
      "id",
      "owner_id",
      "team_id"
    ],
    "CheckIn": [
      "habit_id",
      "user_id",
      "utc_date"
    ]
  },
  "endpoints": [
    "POST /habits/{id}/check-ins",
    "PATCH /check-ins/{id}",
    "GET /teams/{id}/progress"
  ],
  "decisions": [
    {
      "line": 2,
      "topic": "team habit ownership",
      "impact": 3,
      "assumption": "shared team habit with individual check-ins"
    },
    {
      "line": 3,
      "topic": "day boundary",
      "impact": 3,
      "assumption": "UTC calendar day"
    },
    {
      "line": 4,
      "topic": "missed-day grace",
      "impact": 3,
      "assumption": "24 hours after deadline"
    },
    {
      "line": 5,
      "topic": "team habit ownership",
      "impact": 3,
      "assumption": "shared team habit with individual check-ins"
    },
    {
      "line": 6,
      "topic": "historical edits",
      "impact": 3,
      "assumption": "edits recalculate all subsequent streaks"
    },
    {
      "line": 7,
      "topic": "notification delivery",
      "impact": 2,
      "assumption": "email at 20:00 UTC"
    }
  ]
}
```

### frontend engineer
```json
{
  "persona": "frontend engineer",
  "data_model": {
    "HabitCard": [
      "id",
      "team_id",
      "collective_done"
    ],
    "CalendarEntry": [
      "habit_id",
      "local_day"
    ]
  },
  "endpoints": [
    "POST /teams/{id}/habits/{habit}/complete",
    "GET /calendar",
    "GET /notifications"
  ],
  "decisions": [
    {
      "line": 2,
      "topic": "team habit ownership",
      "impact": 3,
      "assumption": "one collective team completion"
    },
    {
      "line": 3,
      "topic": "day boundary",
      "impact": 3,
      "assumption": "user local calendar day"
    },
    {
      "line": 4,
      "topic": "missed-day grace",
      "impact": 3,
      "assumption": "one forgiveness token per week"
    },
    {
      "line": 5,
      "topic": "team habit ownership",
      "impact": 3,
      "assumption": "one collective team completion"
    },
    {
      "line": 6,
      "topic": "historical edits",
      "impact": 3,
      "assumption": "edits change calendar display only"
    },
    {
      "line": 7,
      "topic": "notification delivery",
      "impact": 2,
      "assumption": "in-app banner at local 20:00"
    }
  ]
}
```

### QA engineer
```json
{
  "persona": "QA engineer",
  "data_model": {
    "PersonalHabit": [
      "id",
      "source_team_habit"
    ],
    "CheckIn": [
      "habit_id",
      "timestamp",
      "edit_audit"
    ]
  },
  "endpoints": [
    "POST /personal-habits/{id}/check-ins",
    "PATCH /check-ins/{id}",
    "GET /streak-audit"
  ],
  "decisions": [
    {
      "line": 2,
      "topic": "team habit ownership",
      "impact": 3,
      "assumption": "copied personal habits with aggregate progress"
    },
    {
      "line": 3,
      "topic": "day boundary",
      "impact": 3,
      "assumption": "rolling 24-hour window"
    },
    {
      "line": 4,
      "topic": "missed-day grace",
      "impact": 3,
      "assumption": "no reset until 48 hours of inactivity"
    },
    {
      "line": 5,
      "topic": "team habit ownership",
      "impact": 3,
      "assumption": "copied personal habits with aggregate progress"
    },
    {
      "line": 6,
      "topic": "historical edits",
      "impact": 3,
      "assumption": "edits restricted to previous seven days"
    },
    {
      "line": 7,
      "topic": "notification delivery",
      "impact": 2,
      "assumption": "push two hours before each personal deadline"
    }
  ]
}
```
