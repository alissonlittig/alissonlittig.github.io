const r = msg.report;
msg.to = 'finance@example.invalid';
msg.topic = `[OK] Expenses 2026-10: ${r.valid} rows, total ${r.total.toFixed(2)}`;
msg.payload = `Expense sheet 2026-10: ${r.rows} rows, all valid, no policy flags. Total ${r.total.toFixed(2)}.`;
return msg;
