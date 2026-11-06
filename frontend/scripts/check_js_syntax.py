#!/usr/bin/env python3
"""Chequeo liviano de sintaxis JS local/CI; no sustituye pruebas funcionales."""
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
NODE = shutil.which("node")
if not NODE:
    print("ERROR: Node.js no está disponible en PATH.", file=sys.stderr)
    raise SystemExit(2)

files = []
for pattern in ("js/**/*.js", "vendor/**/*.js"):
    files.extend(ROOT.glob(pattern))

failures = []
checked = 0

def run_check(label: str, content: str) -> None:
    global checked
    checked += 1
    with tempfile.NamedTemporaryFile("w", suffix=".js", encoding="utf-8", delete=False) as tmp:
        tmp.write(content)
        temp_path = Path(tmp.name)
    try:
        result = subprocess.run([NODE, "--check", str(temp_path)], capture_output=True, text=True)
        if result.returncode:
            failures.append((label, result.stderr.strip() or result.stdout.strip()))
            print(f"FAIL {label}")
        else:
            print(f"PASS {label}")
    finally:
        temp_path.unlink(missing_ok=True)

for file in sorted(set(files)):
    run_check(str(file.relative_to(ROOT)), file.read_text(encoding="utf-8"))

script_re = re.compile(r"<script\b([^>]*)>([\s\S]*?)</script\s*>", re.IGNORECASE)
for html_file in sorted(ROOT.glob("*.html")):
    text = html_file.read_text(encoding="utf-8")
    for idx, match in enumerate(script_re.finditer(text), start=1):
        attrs, body = match.group(1), match.group(2)
        if re.search(r"\bsrc\s*=", attrs, re.IGNORECASE):
            continue
        if re.search(r"\btype\s*=\s*['\"](?:application/json|application/ld\+json|text/template)['\"]", attrs, re.IGNORECASE):
            continue
        if not body.strip():
            continue
        run_check(f"{html_file.name}:inline-script-{idx}", body)

if failures:
    print(f"\n{len(failures)} chequeo(s) fallaron de {checked}.", file=sys.stderr)
    for label, error in failures:
        print(f"\n--- {label} ---\n{error}", file=sys.stderr)
    raise SystemExit(1)
print(f"\nOK: {checked} chequeos sintácticos. Esto no equivale a pruebas funcionales/RLS.")
