#!/usr/bin/env python3
"""Una corrida completa para Render: config → CSV → recolectar → ETL → archivar.

Pensado para un Cron Job. El proceso debe terminar al acabar (Render cobra
mientras corre). El histórico de CSV no cabe en el disco de Render, así que
se restaura y se vuelve a subir a Supabase Storage en cada ronda.

Uso:
  python scripts/run_pipeline.py
"""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

ROOT = Path(__file__).resolve().parent.parent
CONFIG_DIR = ROOT / "config"
SECRETS_DIR = Path("/etc/secrets")
PYTHON = sys.executable


def _copy_secret(name: str, env_name: str) -> Path:
    destination = CONFIG_DIR / name
    if destination.exists():
        return destination

    CONFIG_DIR.mkdir(parents=True, exist_ok=True)

    secret_file = SECRETS_DIR / name
    if secret_file.exists():
        destination.write_bytes(secret_file.read_bytes())
        print(f"Config desde Secret File: {name}")
        return destination

    raw = os.getenv(env_name, "").strip()
    if raw:
        destination.write_text(raw, encoding="utf-8")
        print(f"Config desde ${env_name}: {name}")
        return destination

    raise SystemExit(
        f"Falta config/{name}. En Render crea un Secret File llamado "
        f"{name} o define la variable {env_name} con el JSON completo."
    )


def ensure_config() -> None:
    os.chdir(ROOT)
    _copy_secret("devices.json", "DEVICES_JSON")
    _copy_secret("viviendas.json", "VIVIENDAS_JSON")


def run_step(label: str, args: list[str], required: bool = True) -> int:
    print(f"\n==> {label}")
    completed = subprocess.run(args, cwd=ROOT, check=False)
    if completed.returncode != 0:
        message = f"{label} falló con código {completed.returncode}"
        if required:
            raise SystemExit(message)
        print(message)
    return completed.returncode


def main() -> None:
    os.chdir(ROOT)
    os.environ.setdefault("PYTHONPATH", str(ROOT))
    ensure_config()

    archive = [PYTHON, "scripts/csv_archive.py"]
    collector = [PYTHON, "scripts/monitor_viviendas.py", "--once"]
    etl = [PYTHON, "scripts/build_dataset.py", "--subir"]

    run_step("Restaurar CSV", archive + ["download"], required=True)
    run_step("Recolectar Tuya", collector, required=True)

    etl_code = run_step("ETL y subida a Supabase", etl, required=False)
    run_step("Archivar CSV", archive + ["upload"], required=True)

    if etl_code != 0:
        raise SystemExit(
            "La recolección se archivó, pero el ETL no subió datos. "
            "Revisa el contrato o las credenciales de Supabase."
        )

    print("\nPipeline Render terminado.")


if __name__ == "__main__":
    main()
