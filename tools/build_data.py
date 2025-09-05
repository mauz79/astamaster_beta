#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import argparse
import json
import os
import re
import unicodedata
from collections import defaultdict, Counter

import pandas as pd


# -----------------------
# Utils
# -----------------------

def normalize_key(s: str) -> str:
    if s is None:
        return s
    s = str(s).strip()
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode("ascii")
    s = s.lower()
    s = re.sub(r"[^\w]+", "_", s)
    s = re.sub(r"_+", "_", s).strip("_")
    return s

def normalize_text(s: str) -> str:
    if s is None:
        return ""
    s = unicodedata.normalize("NFKD", str(s)).encode("ascii", "ignore").decode("ascii")
    return s.lower().strip()

def load_json(path, default=None):
    if not os.path.exists(path):
        return default
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def try_parse_numeric(series: pd.Series):
    return pd.to_numeric(series, errors="ignore")

def safe_to_native(val):
    if pd.isna(val):
        return None
    return val

def first_matching_col(df_cols_norm, candidates_norm):
    for cand in candidates_norm:
        if cand in df_cols_norm:
            return cand
    return None

def ensure_unique_keys(keys):
    seen = Counter()
    out = []
    for k in keys:
        if k not in seen:
            seen[k] = 1
            out.append(k)
        else:
            seen[k] += 1
            out.append(f"{k}_{seen[k]}")
    return out


# -----------------------
# Core
# -----------------------

def build_year_dataset(year, excel_path, sheet_name, columns_map, teams_aliases, report):
    """
    Legge un Excel, rinomina colonne (normalizza tutte), applica mapping canonico dove disponibile,
    include TUTTE le colonne nel JSON.
    """
    if not os.path.exists(excel_path):
        raise FileNotFoundError(f"File Excel non trovato per {year}: {excel_path}")

    xl = pd.ExcelFile(excel_path, engine="openpyxl")
    sheet_to_use = sheet_name if sheet_name else xl.sheet_names[0]
    df = xl.parse(sheet_to_use)

    original_cols = list(df.columns)
    norm_cols = [normalize_key(c) for c in original_cols]
    norm_cols = ensure_unique_keys(norm_cols)
    df.columns = norm_cols

    # numerici dove possibile
    for col in df.columns:
        df[col] = try_parse_numeric(df[col])

    # alias squadra
    squadra_key = None
    if "squadra" in columns_map:
        candidates_norm = [normalize_key(c) for c in columns_map["squadra"]]
        squadra_key = first_matching_col(set(df.columns), candidates_norm)
    if squadra_key and teams_aliases:
        df[squadra_key] = df[squadra_key].astype(str).map(lambda x: teams_aliases.get(x, x))

    # risolvi colonne chiave
    def resolve_key(key_name):
        cands = columns_map.get(key_name, [])
        cands_norm = [normalize_key(c) for c in cands]
        return first_matching_col(set(df.columns), cands_norm)

    key_cols = {
        "cod": resolve_key("cod"),
        "nome": resolve_key("nome"),
        "ruolo": resolve_key("ruolo"),
        "squadra": resolve_key("squadra"),
    }

    # records completi
    records = []
    for _, row in df.iterrows():
        rec = {col: safe_to_native(row[col]) for col in df.columns}
        rec["_season"] = int(year)
        records.append(rec)

    # report
    report["years"][str(year)] = {
        "excel_path": excel_path,
        "sheet": sheet_to_use,
        "original_columns": original_cols,
        "normalized_columns": df.columns.tolist(),
        "key_columns_resolved": key_cols,
        "row_count": len(df),
    }

    return records, key_cols

def build_index(players_2025, key_cols_2025):
    idx = []
    cod_k = key_cols_2025.get("cod")
    nome_k = key_cols_2025.get("nome")
    ruolo_k = key_cols_2025.get("ruolo")
    squadra_k = key_cols_2025.get("squadra")

    for rec in players_2025:
        cod = rec.get(cod_k) if cod_k else None
        nome = rec.get(nome_k) if nome_k else None
        if not cod or not nome:
            continue
        item = {
            "cod": str(cod),
            "nome": str(nome),
            "nome_norm": normalize_text(nome),
        }
        if ruolo_k and rec.get(ruolo_k) is not None:
            item["ruolo_2025"] = rec.get(ruolo_k)
        if squadra_k and rec.get(squadra_k) is not None:
            item["squadra_2025"] = rec.get(squadra_k)
        idx.append(item)
    return idx

def detect_changes(players_2024, kc_2024, players_2025, kc_2025):
    by24 = {}
    cod24, ruolo24, squadra24 = kc_2024.get("cod"), kc_2024.get("ruolo"), kc_2024.get("squadra")
    for r in players_2024:
        c = r.get(cod24) if cod24 else None
        if c is not None:
            by24[str(c)] = r

    cod25, ruolo25, squadra25 = kc_2025.get("cod"), kc_2025.get("ruolo"), kc_2025.get("squadra")
    changes = {}
    for r in players_2025:
        c = r.get(cod25) if cod25 else None
        if c is None:
            continue
        c = str(c)
        old = by24.get(c)
        chg = {}
        if old is not None:
            if ruolo25 and ruolo24:
                chg["cambio_ruolo"] = (r.get(ruolo25) != old.get(ruolo24))
            if squadra25 and squadra24:
                chg["cambio_squadra"] = (r.get(squadra25) != old.get(squadra24))
        else:
            chg["cambio_ruolo"] = None
            chg["cambio_squadra"] = None
        changes[c] = chg
    return changes

def build_storico(players_by_year, key_cols_by_year, agg_cfg):
    seasons_for_history = agg_cfg.get("seasons_for_history", [])
    sum_fields = [normalize_key(x) for x in agg_cfg.get("sum_fields", [])]
    mean_fields = [normalize_key(x) for x in agg_cfg.get("mean_fields", [])]
    include_raw_per_season = agg_cfg.get("include_raw_per_season", False)

    # indicizza per stagione
    indexed = {}
    for y, recs in players_by_year.items():
        kc = key_cols_by_year.get(y, {})
        cod_k = kc.get("cod")
        if not cod_k:
            continue
        d = {}
        for r in recs:
            c = r.get(cod_k)
            if c is not None:
                d[str(c)] = r
        indexed[y] = (d, kc)

    storico = []
    d2025, _ = indexed.get(2025, ({}, {}))
    for cod_str in d2025.keys():
        agg = {"cod": cod_str, "stagioni_considerate": seasons_for_history}
        sums = defaultdict(float)
        means = defaultdict(list)
        raw = {}

        for y in seasons_for_history:
            d_y, _ = indexed.get(y, ({}, {}))
            rec = d_y.get(cod_str)
            if not rec:
                continue
            if include_raw_per_season:
                raw[str(y)] = rec
            for f in sum_fields:
                v = rec.get(f)
                if isinstance(v, (int, float)) and pd.notna(v):
                    sums[f] += float(v)
            for f in mean_fields:
                v = rec.get(f)
                if isinstance(v, (int, float)) and pd.notna(v):
                    means[f].append(float(v))

        for f, total in sums.items():
            agg[f + "_totali"] = round(total, 2)
        for f, arr in means.items():
            agg[f + "_media"] = round(sum(arr) / len(arr), 3) if arr else None
        if include_raw_per_season:
            agg["raw_per_season"] = raw

        storico.append(agg)

    return storico


def main():
    ap = argparse.ArgumentParser(description="Genera JSON stagionali completi + index + storico.")
    ap.add_argument("--input", required=True, help="Cartella Excel (es. tools/input)")
    ap.add_argument("--out", required=True, help="Cartella output (es. data)")
    ap.add_argument("--seasons", nargs="+", type=int, default=[2021, 2022, 2023, 2024, 2025], help="Anni inizio stagione")
    ap.add_argument("--sheet", default=None, help='Nome foglio (es. "Tutti i dati")')
    ap.add_argument("--pattern", default="{year}.xlsx", help="Pattern filename")
    ap.add_argument("--config_map", default="tools/config/columns_mapping.json", help="Path mappa colonne")
    ap.add_argument("--config_agg", default="tools/config/aggregation_config.json", help="Path config aggregazioni")
    ap.add_argument("--teams_aliases", default="tools/config/teams_aliases.json", help="Path alias squadre")
    args = ap.parse_args()

    os.makedirs(args.out, exist_ok=True)

    columns_map = load_json(args.config_map, default={})
    agg_cfg = load_json(args.config_agg, default={})
    teams_aliases = load_json(args.teams_aliases, default={})

    report = {"years": {}, "warnings": []}

    players_by_year = {}
    key_cols_by_year = {}

    # 1) Stagioni -> JSON completi
    for y in args.seasons:
        excel_path = os.path.join(args.input, args.pattern.format(year=y))
        records, key_cols = build_year_dataset(y, excel_path, args.sheet, columns_map, teams_aliases, report)
        players_by_year[y] = records
        key_cols_by_year[y] = key_cols

        with open(os.path.join(args.out, f"{y}.json"), "w", encoding="utf-8") as f:
            json.dump(records, f, ensure_ascii=False, separators=(",", ":"))

    # 2) Index.json (ricerca) dalla 2025
    if 2025 not in players_by_year:
        report["warnings"].append("Stagione 2025 non presente: index.json vuoto.")
        idx = []
    else:
        idx = build_index(players_by_year[2025], key_cols_by_year[2025])
    with open(os.path.join(args.out, "index.json"), "w", encoding="utf-8") as f:
        json.dump(idx, f, ensure_ascii=False, separators=(",", ":"))

    # 3) Flag cambi su 2025 basati su 2024
    if 2025 in players_by_year and 2024 in players_by_year:
        changes = detect_changes(players_by_year[2024], key_cols_by_year[2024], players_by_year[2025], key_cols_by_year[2025])
        cod25 = key_cols_by_year[2025].get("cod")
        for rec in players_by_year[2025]:
            c = rec.get(cod25) if cod25 else None
            if c is None:
                continue
            chg = changes.get(str(c), {})
            rec["cambio_ruolo"] = chg.get("cambio_ruolo")
            rec["cambio_squadra"] = chg.get("cambio_squadra")
        with open(os.path.join(args.out, "2025.json"), "w", encoding="utf-8") as f:
            json.dump(players_by_year[2025], f, ensure_ascii=False, separators=(",", ":"))

    # 4) Storico
    storico = build_storico(players_by_year, key_cols_by_year, agg_cfg)
    with open(os.path.join(args.out, "storico.json"), "w", encoding="utf-8") as f:
        json.dump(storico, f, ensure_ascii=False, separators=(",", ":"))

    # 5) Report build
    lines = [
        "# Report build dati\n",
        "Questo report riassume colonne importate, mappature chiave e avvisi.\n",
    ]
    for y in args.seasons:
        yinfo = report["years"].get(str(y))
        if not yinfo:
            continue
        lines.append(f"## {y}\n")
        lines.append(f"- File: `{yinfo['excel_path']}`  (foglio: `{yinfo['sheet']}`)\n")
        lines.append(f"- Righe: {yinfo['row_count']}\n")
        lines.append(f"- Colonne originali ({len(yinfo['original_columns'])}): {', '.join(map(str, yinfo['original_columns']))}\n")
        lines.append(f"- Colonne normalizzate ({len(yinfo['normalized_columns'])}): {', '.join(map(str, yinfo['normalized_columns']))}\n")
        kc = yinfo["key_columns_resolved"]
        lines.append(f"- Colonne chiave risolte: COD=`{kc.get('cod')}`, NOME=`{kc.get('nome')}`, RUOLO=`{kc.get('ruolo')}`, SQUADRA=`{kc.get('squadra')}`\n")

    if report["warnings"]:
        lines.append("\n### Avvisi\n")
        for w in report["warnings"]:
            lines.append(f"- {w}\n")

    with open(os.path.join(args.out, "build_report.md"), "w", encoding="utf-8") as f:
        f.write("".join(lines))

    print(" Build completata.")
    print(f"- JSON stagionali in: {args.out}")
    print("- Controlla `build_report.md` per copertura colonne e mappature.")
    print("- Verifica `2025.json` contenga `cambio_squadra` e `cambio_ruolo` se 2024 presente.")


if __name__ == "__main__":
    main()
