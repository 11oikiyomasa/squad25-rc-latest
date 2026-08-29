# Scrims

## Public flow
- `/scrims` shows only public, non-cancelled scrims.
- Scheduled/live rooms appear under **Next rooms**.
- Completed rooms appear under **Results**.
- Private rooms and internal notes never render publicly.

## Admin flow
- `/admin/scrims` requires the existing admin gate.
- Admins can create, edit, publish/unpublish, complete, cancel, and delete scrims.
- Time input is treated as Asia/Jakarta (WIB).
- Completed scrims require both scores.

The production database is intentionally empty until real scrim data is entered by an admin; no fabricated opponent or result data is seeded.
