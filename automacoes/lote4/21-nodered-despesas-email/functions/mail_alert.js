const r = msg.report, L = [];
L.push(`Expense sheet 2026-10: ${r.rows} rows, ${r.valid} valid, total ${r.total.toFixed(2)}.`, '');
if (r.flagged.length) { L.push('Needs review:'); r.flagged.forEach(f => L.push(`- line ${f.line}, ${f.employee}, ${f.category} ${f.amount.toFixed(2)}: ${f.flags.join('; ')}`)); L.push(''); }
if (r.invalid.length) { L.push('Rejected rows (not counted):'); r.invalid.forEach(x => L.push(`- line ${x.line}: ${x.why}`)); }
msg.to = 'finance@example.invalid';
msg.topic = `[ACTION] Expenses 2026-10: ${r.flagged.length} to review, ${r.invalid.length} rejected`;
msg.payload = L.join('\n');
return msg;
