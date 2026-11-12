msg.queued = { subject: msg.topic, to: msg.to, reason: msg.error && msg.error.message };
msg.payload = JSON.stringify({ subject: msg.topic, to: msg.to, body: msg.payload, reason: msg.queued.reason });
return msg;
