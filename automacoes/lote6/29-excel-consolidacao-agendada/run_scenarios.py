"""Roda o fluxo de verdade em 4 pastas de entrada e grava output/scenarios.json + output/consolidado_ok.xlsx."""
import datetime as dt, json, pathlib
import fluxo
HERE = pathlib.Path(__file__).parent; OK = fluxo.load_dir(HERE / "fixtures" / "ok")
BAD = dict(OK); BAD["londrina.csv"] = OK["londrina.csv"] + "2026-02-31,Caneta gel,3,3.5\n2026-11-10,Mochila,-2,89.9\n"
HDR = dict(OK); HDR["maringa.csv"] = OK["maringa.csv"].replace("preco_unit", "preco")
FILES = {"ok": OK, "bad_rows": BAD, "repeat": OK, "bad_header": HDR}
SEQ = [("ok", "daily@07:30", "2026-11-12 08:00"), ("bad_rows", "daily@07:30", "2026-11-12 06:10"), ("repeat", "every:15m", "2026-11-12 08:00"), ("bad_header", "daily@07:30", "2026-11-12 08:00")]


def main():
    R = {}
    for k, spec, now in SEQ:
        ledger = {fluxo.fnv(OK["curitiba.csv"])} if k == "repeat" else set()
        res = fluxo.consolidate(FILES[k], ledger); nr = fluxo.next_run(dt.datetime.fromisoformat(now), spec).strftime("%Y-%m-%d %H:%M")
        R[k] = {"input": {"inbox": k, "agenda": spec, "agora": now}, "arquivos": res["arquivos"], "linhas": res["linhas"], "erros": res["erros"], "resumo": res["resumo"], "total": res["total"], "proxima": nr}
        if k == "ok": fluxo.write_xlsx(res, HERE / "output" / "consolidado_ok.xlsx")
    (HERE / "output").mkdir(exist_ok=True); (HERE / "output" / "scenarios.json").write_text(json.dumps(R, indent=1, ensure_ascii=False), "utf-8"); return R


if __name__ == "__main__": main(); print("ok")
