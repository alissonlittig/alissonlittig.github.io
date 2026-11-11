# Responses from the published webhook (real run)

The editor run in the GIF used ORD-2001-F: System B fails twice (503) and succeeds on the 3rd try.

**Valid order** -> HTTP 200: `{"ok": true, "status": "synced", "system_b_id": "B-ORD-2002", "duplicate": false}`

**Same order again (idempotent)** -> HTTP 200: `{"ok": true, "status": "synced", "system_b_id": "B-ORD-2002", "duplicate": true}`

**System B down (always 503)** -> HTTP 202: `{"ok": false, "status": "queued", "message": "System B unavailable; order saved for manual replay"}`

**Invalid order** -> HTTP 400: `{"ok": false, "errors": ["id is required", "customer_email is invalid", "items must be a non-empty array", "order total must be positive"]}`

System B state (attempts per order, mock): `{"ORD-2001-F": 3, "ORD-2002": 2, "ORD-2003-X": 3}`
