const H = 'employee,date,category,amount,receipt';
const body = typeof msg.payload === 'string' ? msg.payload.trim() : '';
const first = body.split(/\r?\n/)[0] || '';
if (first.trim() !== H) {
    msg.statusCode = 422;
    msg.payload = { error: 'bad header', expected: H, got: first.slice(0, 80) };
    return [null, msg];
}
msg.payload = body;
return [msg, null];
