msg.statusCode = 202;
msg.payload = { status: 'queued', note: 'e-mail not sent; saved in outbox_retry.jsonl for retry', subject: msg.queued.subject, reason: msg.queued.reason, rows: msg.report.rows, flagged: msg.report.flagged.length, rejected: msg.report.invalid.length };
return msg;
