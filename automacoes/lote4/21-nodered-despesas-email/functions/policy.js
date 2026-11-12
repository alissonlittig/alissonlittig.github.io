const CATS = ['travel', 'meals', 'software', 'office'];
const rows = msg.payload, invalid = [], flagged = [], seen = {}, ok = [];
rows.forEach((r, i) => {
    const line = i + 2, amt = Number(r.amount); let why = null;
    if (!String(r.employee || '').trim()) why = 'missing employee';
    else if (!/^2026-10-\d\d$/.test(String(r.date))) why = 'date outside 2026-10';
    else if (!CATS.includes(String(r.category))) why = 'unknown category ' + r.category;
    else if (!(amt > 0)) why = 'amount must be > 0';
    if (why) { invalid.push({ line, why }); return; }
    const key = [r.employee, r.date, r.category, amt].join('|'), flags = [];
    if (amt > 500) flags.push('over 500: manager approval');
    if (String(r.receipt) !== 'yes' && amt > 50) flags.push('receipt required above 50');
    if (seen[key]) flags.push('possible duplicate of line ' + seen[key]); else seen[key] = line;
    ok.push({ line, amount: amt });
    if (flags.length) flagged.push({ line, employee: r.employee, category: r.category, amount: amt, flags });
});
const total = Math.round(ok.reduce((a, r) => a + r.amount * 100, 0)) / 100;
msg.report = { rows: rows.length, valid: ok.length, invalid, flagged, total, needs_action: invalid.length + flagged.length > 0 };
return msg;
