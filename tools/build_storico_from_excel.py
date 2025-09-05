#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import argparse, json, os, re, unicodedata
import pandas as pd

def canon(s: str) -> str:
    if s is None: return ""
    s = str(s)
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode("ascii")
    s = s.lower()
    s = re.sub(r"[^\w\s]+", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s

def to_number(x, is_percent=False):
    if x is None: return None
    if isinstance(x, (int, float)):
        val = float(x)
        if is_percent and val is not None and val > 1.0:
            val = val / 100.0
        return val
    xs = str(x).strip()
    if xs == "" or xs.lower() in {"n.d", "nd", "n.d.", "na", "n/a", "—", "-", "null"}: return None
    pct = False
    if xs.endswith('%'): pct=True; xs = xs[:-1]
    if xs.count(',')==1 and xs.count('.')==0:
        xs = xs.replace('.', '').replace(',', '.')
    xs = xs.replace(' ', '')
    try:
        val = float(xs)
        if (is_percent or pct) and val > 1.0: val = val/100.0
        return val
    except Exception:
        return None

# Normalizza COD a stringa "intera" (es. 101507.0 -> "101507")
def norm_cod_value(v):
    if v is None: return None
    if isinstance(v, (int, float)):
        if float(v).is_integer(): return str(int(v))
        return str(v)
    s = str(v).strip()
    if re.fullmatch(r"[0-9]+\.0", s): return s[:-2]
    return s

# Fuzzy resolver: cerca match esatto canon e poi per token containment
def resolve_column(original_cols, canon_cols, candidates):
    idx_by_canon = {c:i for i,c in enumerate(canon_cols)}
    # 1) esatto
    for cand in candidates:
        c = canon(cand)
        if c in idx_by_canon:
            return original_cols[idx_by_canon[c]]
    # 2) fuzzy: token contenuto
    cand_tokens = set()
    for cand in candidates:
        cand_tokens.update(canon(cand).split())
    best = None
    for i,c in enumerate(canon_cols):
        tokens = set(c.split())
        if cand_tokens and cand_tokens.issubset(tokens):
            best = original_cols[i]; break
        # caso particolare: voglio una colonna con token 'cod' o 'nome'
        if 'cod' in cand_tokens and ('cod' in tokens or 'codice' in tokens): best = original_cols[i]
        if 'nome' in cand_tokens and 'nome' in tokens: best = original_cols[i]
    return best


def main():
    ap = argparse.ArgumentParser(description="Genera storico.json partendo da storico.xlsx con intestazioni custom.")
    ap.add_argument("--file", required=True)
    ap.add_argument("--sheet", default="Tutti i dati")
    ap.add_argument("--out", required=True)
    ap.add_argument("--seasons_considered", nargs="+", type=int, default=[2021,2022,2023,2024])
    args = ap.parse_args()

    if not os.path.exists(args.file):
        raise FileNotFoundError(f"File non trovato: {args.file}")

    MAP = {
        "cod": ["cod", "codice", "cod giocatore", "codice giocatore", "cod - codice", "cod codice", "cod (id)", "id cod"],
        "nome": ["nome", "nome giocatore", "giocatore"],
        "sq": ["sq", "squadra attuale 2025", "squadra 2025", "squadra"],
        "r": ["r", "ruolo attuale 2025", "ruolo 2025", "ruolo"],
        "oldsq": ["oldsq", "old sq"],
        "squadra_2024_status": ["squadra 2024", "status squadra 2024", "stato squadra 2024", "squadra (2024)", "squadra stagione 2024", "squadra_2024"],
        "ruolo_2024": ["ruolo 2024", "r 2024"],
        "oldr": ["oldr", "old r"],
        "cambio_ruolo_descr": ["cambio ruolo", "descr cambio ruolo", "note cambio ruolo"],
        "p_2024": ["p 2024", "presenze 2024"],
        "aff_2024": ["aff 2024", "aff% 2024", "afff% 2024", "affidabilita 2024", "affidabilita% 2024"],
        "mvt_2024": ["mvt 2024", "media voto 2024", "mv 2024"],
        "mvand_2024": ["and. mvt 2024", "and mvt 2024", "andamento mvt 2024", "andamento mv 2024", "mv and 2024"],
        "fmt_2024": ["fmvt 2024", "fmt 2024", "fantamedia 2024", "fm 2024"],
        "fmand_2024": ["and. fmt 2024", "and fmt 2024", "andamento fmt 2024", "fm and 2024"],
        "p_tot_4stag": ["p tot", "presenze tot", "presenze totali"],
        "p_media_stagione": ["p medie stagione", "presenze medie stagione"],
        "aff_media_stagione": ["aff% media stagione", "aff media stagione", "affidabilita media stagione", "affidabilita% media stagione"],
        "mvt_media_stagione": ["mvt media stagione", "media voto media stagione", "mv media stagione"],
        "fmt_media_stagione": ["fmvt media stagione", "fmt media stagione", "fantamedia media stagione", "fm media stagione"],
        "gf_media_stagione": ["gol medi stagione", "gol medi per stagione"],
        "gf_per_presenza": ["gol su presenze", "gol per presenze", "gol per presenza"],
        "presenze_per_gol": ["presenze per un gol", "presenze per gol"],
        "gf_media_stagione_norm": ["gol medi stagione normalizzato", "gol medi stagione normalizzati", "gol medi stagione (normalizzato)", "gol attesi", "gol attesi medi"],
        "as_media_stagione": ["assist medi stagione", "assist medi per stagione"],
        "as_per_presenza": ["assist su presenze", "assist per presenze", "assist per presenza"],
        "presenze_per_assist": ["presenze per un assist", "presenze per assist", "presenze per ogni assist", "presenze/assist", "presenze x assist", "presenze per un'assist"],
        "as_media_stagione_norm": ["assist medi stagione normalizzato", "assist medi stagione normalizzati", "assist medi stagione (normalizzato)", "assist medi stagione (normalizzati)", "assist attesi", "assist attesi medi", "assist medi (attesi)", "assist medi stagione attesi", "assist medi stagione norm", "as medie stagione (normalizzate)", "as medie stagione normalizzate"],
        "a_media_stagione": ["ammonizioni medie stagione", "ammonizioni medie per stagione"],
        "a_per_presenza": ["ammonizioni per presenze", "ammonizioni per presenza"],
        "presenze_per_ammonizione": ["presenze per un ammonizione", "presenze per un’ammonizione", "presenze per un'ammonizione", "presenze per ammonizione"],
        "a_media_stagione_norm": ["a medie stagione normalizzate", "ammonizioni medie stagione normalizzate", "ammonizioni attese"],
        "e_media_stagione": ["espulsioni medie stagione", "espulsioni medie per stagione"],
        "e_per_presenza": ["espulsioni per presenze", "espulsioni per presenza"],
        "presenze_per_espulsione": ["presenze per un espulsione", "presenze per un’espulsione", "presenze per un'espulsione", "presenze per espulsione"],
        "e_media_stagione_norm": ["e medie stagione normalizzate", "espulsioni medie stagione normalizzate", "espulsioni attese"],
        "gs_media_stagione": ["gol subiti medi stagione", "gs medi stagione"],
        "gs_per_presenza": ["gol subiti su presenze", "gs per presenze", "gs per presenza"],
        "gs_media_stagione_norm": ["gs medi stagione normalizzate", "gol subiti medi (normalizzati)", "gs attesi"],
        "rp_media_stagione": ["rigori parati medi stagione", "rp medi stagione"],
        "rp_per_presenza": ["rp per presenza", "rigori parati per presenza", "rigori parati per presenze"],
        "presenze_per_rp": ["presenze per un rigore parato", "presenze per rp"],
        "rp_media_stagione_norm": ["rp medi stagione normalizzate", "rigori parati medi (normalizzati)", "rp attesi"]
    }

    xl = pd.ExcelFile(args.file, engine="openpyxl")
    sheet_to_use = args.sheet if args.sheet else xl.sheet_names[0]
    df = xl.parse(sheet_to_use)

    original_cols = list(df.columns)
    canon_cols = [canon(c) for c in original_cols]

    # Risoluzione mapping (esatto + fuzzy)
    resolved = {}
    for out_key, candidates in MAP.items():
        col = resolve_column(original_cols, canon_cols, candidates)
        resolved[out_key] = col

    missing = [k for k, v in resolved.items() if v is None]
    if missing:
        print("⚠️  Attenzione: alcune colonne non sono state trovate in storico.xlsx:")
        for k in missing:
            print("   -", k, " (headers attesi:", ", ".join(MAP[k]), ")")

    out = []
    for _, row in df.iterrows():
        rec = {}
        for key in ["cod", "nome", "sq", "r", "oldsq", "squadra_2024_status", "ruolo_2024", "oldr", "cambio_ruolo_descr"]:
            col = resolved.get(key)
            if col is not None:
                val = row[col]
                if key == "cod":
                    rec[key] = norm_cod_value(val)
                else:
                    rec[key] = None if pd.isna(val) else str(val).strip()
        numeric_keys = [k for k in resolved.keys() if k not in {"cod","nome","sq","r","oldsq","squadra_2024_status","ruolo_2024","oldr","cambio_ruolo_descr"}]
        for key in numeric_keys:
            col = resolved.get(key)
            if col is None: continue
            is_pct = key in {"aff_2024", "aff_media_stagione"}
            rec[key] = to_number(row[col], is_percent=is_pct)
        # fallback presenze_per_assist
        if rec.get("presenze_per_assist") is None and rec.get("as_per_presenza"):
            try:
                v = float(rec["as_per_presenza"]) if rec["as_per_presenza"] is not None else None
                rec["presenze_per_assist"] = round(1.0 / v, 3) if (v is not None and v > 0) else None
            except Exception:
                pass
        rec["stagioni_considerate"] = args.seasons_considered
        if rec.get("cod") and rec.get("nome"):
            out.append(rec)

    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, separators=(',', ':'))

    print(f"✅ Storico generato: {args.out}  (records: {len(out)})")
    if missing:
        print("⚠️  Nota: mancano nel mapping i campi:", ", ".join(missing))

if __name__ == '__main__':
    main()
