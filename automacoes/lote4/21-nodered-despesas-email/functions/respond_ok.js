msg.statusCode = 200;
msg.payload = { status: 'emailed', subject: msg.topic, rows: msg.report.rows, valid: msg.report.valid, flagged: msg.report.flagged.length, rejected: msg.report.invalid.length, total: msg.report.total };
return msg;
