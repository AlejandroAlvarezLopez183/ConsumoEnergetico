#!/usr/bin/env python3
"""Crea (o actualiza) las cuentas a partir de un CSV.

CSV de entrada (usuarios.csv), una fila por cuenta:
  usuario,rol,vivienda,password
  admin.lab,admin,,                  <- administrador (sin vivienda)
  casa004,habitante,Vivienda-004,    <- habitante; si password va vacío se genera una
  casa009,habitante,Vivienda-009,MiClave-2026

Uso:
  export SUPABASE_URL="https://xxxx.supabase.co"
  export SUPABASE_SERVICE_KEY="eyJ..."
  python3 crear_usuarios.py usuarios.csv

Escribe `usuarios_con_claves.csv` con las contraseñas para entregarlas. Ese archivo
contiene secretos: no lo subas a GitHub ni a Netlify (ya está en .gitignore).
El usuario puede ser un correo real (con @) o un nombre simple: en ese caso la cuenta
se crea como <usuario>@<USER_DOMAIN> y la página agrega el dominio por sí sola.
"""
import csv, json, os, secrets, string, sys, urllib.request, urllib.error

URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
USER_DOMAIN = os.environ.get("USER_DOMAIN", "viviendas.example.com")   # igual que en config.js
if not URL or not KEY or len(sys.argv) != 2:
    sys.exit(__doc__)

H = {"apikey": KEY, "Authorization": f"Bearer {KEY}", "Content-Type": "application/json"}

def call(method, path, body=None, extra=None):
    req = urllib.request.Request(URL + path, method=method,
                                 data=None if body is None else json.dumps(body).encode(),
                                 headers={**H, **(extra or {})})
    try:
        r = urllib.request.urlopen(req, timeout=60).read()
        return 200, (json.loads(r) if r else None)
    except urllib.error.HTTPError as e:
        try: return e.code, json.loads(e.read())
        except Exception: return e.code, None

def gen_pw():
    a = string.ascii_letters + string.digits
    return "".join(secrets.choice(a) for _ in range(10)) + "-" + "".join(secrets.choice(string.digits) for _ in range(2))

def find_user(email):
    page = 1
    while True:
        c, r = call("GET", f"/auth/v1/admin/users?page={page}&per_page=200")
        users = (r or {}).get("users", [])
        for u in users:
            if (u.get("email") or "").lower() == email: return u["id"]
        if len(users) < 200: return None
        page += 1

out = []
for row in csv.DictReader(open(sys.argv[1], encoding="utf-8-sig")):
    usuario = row["usuario"].strip()
    rol = (row.get("rol") or "habitante").strip()
    viv = (row.get("vivienda") or "").strip() or None
    if rol not in ("admin", "habitante") or (rol == "habitante" and not viv):
        sys.exit(f"Fila inválida: {row}")
    email = (usuario if "@" in usuario else f"{usuario}@{USER_DOMAIN}").lower()
    pw = (row.get("password") or "").strip() or gen_pw()
    code, r = call("POST", "/auth/v1/admin/users", {"email": email, "password": pw, "email_confirm": True})
    if code in (200, 201):
        uid = r["id"]; estado = "creada"
    else:                                   # ya existía: actualiza contraseña
        uid = find_user(email)
        if not uid: sys.exit(f"No pude crear ni encontrar {email}: {code} {r}")
        call("PUT", f"/auth/v1/admin/users/{uid}", {"password": pw}); estado = "actualizada"
    c2, r2 = call("POST", "/rest/v1/perfiles",
                  [{"user_id": uid, "usuario": usuario.lower(), "rol": rol, "vivienda": viv}],
                  {"Prefer": "resolution=merge-duplicates,return=minimal"})
    if c2 >= 300: sys.exit(f"Perfil de {usuario}: {c2} {r2}")
    print(f"{estado:11} {usuario:20} {rol:10} {viv or ''}")
    out.append({"usuario": usuario, "rol": rol, "vivienda": viv or "", "password": pw})

with open("usuarios_con_claves.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=["usuario", "rol", "vivienda", "password"]); w.writeheader(); w.writerows(out)
print("\nContraseñas guardadas en usuarios_con_claves.csv (entrégalas y bórralo).")
