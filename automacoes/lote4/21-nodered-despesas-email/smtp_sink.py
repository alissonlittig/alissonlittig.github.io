"""Servidor SMTP local que só guarda os e-mails em .eml (nada sai da máquina). uso: python smtp_sink.py <pasta>"""
import sys, pathlib, time
from aiosmtpd.controller import Controller
class H:
    n = 0
    def __init__(s, d): s.d = pathlib.Path(d); s.d.mkdir(parents=True, exist_ok=True)
    async def handle_DATA(s, server, session, env):
        s.n += 1; (s.d / f"{s.n:02d}.eml").write_bytes(env.content); return "250 OK queued"
def start(folder, port=2525):
    c = Controller(H(folder), hostname="127.0.0.1", port=port); c.start(); return c
if __name__ == "__main__":
    start(sys.argv[1]); print("sink em 127.0.0.1:2525"); time.sleep(10**6)
