#!/usr/bin/env python3
"""Sube data.json (salida de process.py) a Supabase: tabla `meta` y `vivienda_datos`.

Uso:
  export SUPABASE_URL="https://xxxx.supabase.co"
  export SUPABASE_SERVICE_KEY="eyJ..."        # service_role, Project Settings > API (secreta)
  python3 cargar_datos.py ruta/a/data.json

Se puede ejecutar las veces que quieras: reemplaza lo que ya existe.
Nunca se sube el campo `nombre` de las personas.
"""
import json, os, sys, urllib.request, urllib.error

URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
if not URL or not KEY or len(sys.argv) != 2:
    sys.exit(__doc__)

def upsert(tabla, filas):
    req = urllib.request.Request(
        f"{URL}/rest/v1/{tabla}", method="POST",
        data=json.dumps(filas, ensure_ascii=False).encode(),
        headers={"apikey": KEY, "Authorization": f"Bearer {KEY}",
                 "Content-Type": "application/json",
                 "Prefer": "resolution=merge-duplicates,return=minimal"})
    try:
        urllib.request.urlopen(req, timeout=60).read()
    except urllib.error.HTTPError as e:
        sys.exit(f"Error {e.code} en {tabla}: {e.read().decode()[:400]}")

d = json.load(open(sys.argv[1], encoding="utf-8"))
meta = {k: d[k] for k in ("inicio", "horas", "dias", "datos_desde", "datos_hasta", "caidas_sistema")}
upsert("meta", [{"id": 1, "datos": meta, "actualizado": "now()"}])

filas = []
for h in d["viviendas"]:
    h = dict(h); h.pop("nombre", None)
    h["sensores_det"] = [s for s in d["sensores"] if s["vivienda"] == h["codigo"]]
    filas.append({"codigo": h["codigo"], "datos": h, "actualizado": "now()"})
for i in range(0, len(filas), 6):
    upsert("vivienda_datos", filas[i:i + 6])
print(f"Listo: meta + {len(filas)} viviendas cargadas.")
