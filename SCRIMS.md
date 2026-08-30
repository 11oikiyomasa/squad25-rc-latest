# Match Center

## Public lifecycle
Public match records follow one explicit lifecycle:

```text
SCHEDULED → LIVE → COMPLETED
     └────────────→ CANCELLED
```

- `/matches` is the canonical public Match Center; `/scrims` is legacy-compatible and redirects there.
- **Scheduled** shows opponent, WIB date/time, format, event, and a countdown when the next room is within 72 hours.
- **Live** shows a clear LIVE state and current series score when available.
- **Completed** shows result, final score, and optional recap/media links.
- **Cancelled** is shown separately when the public record was cancelled, so a published schedule does not silently lose context.
- Empty states are intentional and explain what will appear when data exists.
- Private records and admin notes never render publicly.

## Admin lifecycle
- `/admin/matches` is the canonical control room; `/admin/scrims` redirects there.
- New matches must start as **SCHEDULED**.
- Allowed transitions are **SCHEDULED → LIVE**, **SCHEDULED → CANCELLED**, **LIVE → COMPLETED**, and **LIVE → CANCELLED**.
- Once a match is **COMPLETED** or **CANCELLED**, its lifecycle state cannot move backwards.
- Scheduled/cancelled matches cannot carry a result; live results may be empty or have both scores; completed matches require both scores.
- Optional recap and media URLs must use HTTPS.
- Time input is treated as Asia/Jakarta (WIB).

The production database is intentionally empty until real match data is entered by an admin; no fabricated opponent, score, event, or result data is seeded.
