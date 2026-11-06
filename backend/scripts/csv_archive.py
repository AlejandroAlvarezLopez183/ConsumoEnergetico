#!/usr/bin/env python3
"""Persiste los CSV de viviendas en Supabase Storage.

Render no da disco persistente a los Cron Jobs: el filesystem se borra al
terminar cada corrida. El histórico de lecturas vive en un bucket privado
y se restaura antes de recolectar / ETL.

Uso:
  python scripts/csv_archive.py ensure
  python scripts/csv_archive.py download
  python scripts/csv_archive.py upload
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

LOCAL_DIRECTORY = Path("data/viviendas")
OBJECT_PREFIX = "viviendas"
DEFAULT_BUCKET = "snrgy-csv"


class StorageError(RuntimeError):
    def __init__(self, status: int, message: str):
        super().__init__(message)
        self.status = status


def _settings() -> tuple[str, str, str]:
    url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("SUPABASE_SERVICE_KEY", "")
    bucket = os.environ.get("SUPABASE_CSV_BUCKET", DEFAULT_BUCKET)

    if not url or not key:
        raise SystemExit(
            "Faltan SUPABASE_URL o SUPABASE_SERVICE_KEY "
            "para el archivo de CSV en Storage."
        )

    return url, key, bucket


def _request(
    *,
    method: str,
    path: str,
    data: bytes | None = None,
    content_type: str | None = None,
    extra_headers: dict | None = None,
    timeout: int = 60,
) -> bytes:
    url, key, _bucket = _settings()
    headers = {
        "Authorization": f"Bearer {key}",
        "apikey": key,
    }
    if content_type:
        headers["Content-Type"] = content_type
    if extra_headers:
        headers.update(extra_headers)

    request = urllib.request.Request(
        f"{url}{path}",
        data=data,
        method=method,
        headers=headers,
    )

    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return response.read()
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")[:500]
        raise StorageError(
            error.code,
            f"Storage {error.code} {method} {path}: {body}",
        ) from error


def ensure_bucket() -> str:
    """Crea el bucket privado si aún no existe. Devuelve el nombre."""

    _url, _key, bucket = _settings()

    try:
        _request(method="GET", path=f"/storage/v1/bucket/{bucket}")
        print(f"Bucket listo: {bucket}")
        return bucket
    except StorageError as error:
        if error.status not in {400, 404}:
            raise

    payload = json.dumps(
        {
            "id": bucket,
            "name": bucket,
            "public": False,
            "file_size_limit": 52428800,
        }
    ).encode()

    try:
        _request(
            method="POST",
            path="/storage/v1/bucket",
            data=payload,
            content_type="application/json",
        )
        print(f"Bucket creado: {bucket}")
    except StorageError as error:
        duplicated = error.status in {409, 400} or "exists" in str(error).lower()
        if not duplicated:
            raise
        print(f"Bucket ya existía: {bucket}")

    return bucket


def list_csv_objects() -> list[str]:
    _url, _key, bucket = _settings()
    payload = json.dumps(
        {
            "prefix": f"{OBJECT_PREFIX}/",
            "limit": 1000,
            "offset": 0,
        }
    ).encode()

    raw = _request(
        method="POST",
        path=f"/storage/v1/object/list/{bucket}",
        data=payload,
        content_type="application/json",
    )
    items = json.loads(raw.decode() or "[]")
    names = []
    for item in items:
        name = item.get("name") if isinstance(item, dict) else None
        if not name or item.get("id") is None:
            continue
        if name.endswith(".csv"):
            names.append(name)
    return sorted(names)


def download_csvs(directory: Path = LOCAL_DIRECTORY) -> int:
    """Restaura los CSV del bucket sobre `data/viviendas`."""

    ensure_bucket()
    directory.mkdir(parents=True, exist_ok=True)
    _url, _key, bucket = _settings()
    names = list_csv_objects()

    if not names:
        print("Storage no tiene CSV todavía; se parte de cero en esta corrida.")
        return 0

    for name in names:
        object_path = f"{OBJECT_PREFIX}/{name}"
        content = _request(
            method="GET",
            path=f"/storage/v1/object/{bucket}/{object_path}",
            timeout=120,
        )
        destination = directory / Path(name).name
        destination.write_bytes(content)
        print(f"Restaurado {destination} ({len(content)} bytes)")

    print(f"Restaurados {len(names)} CSV desde Storage.")
    return len(names)


def upload_csvs(directory: Path = LOCAL_DIRECTORY) -> int:
    """Sube todos los CSV locales al bucket (upsert)."""

    ensure_bucket()
    _url, _key, bucket = _settings()
    files = sorted(directory.glob("*.csv")) if directory.exists() else []

    if not files:
        print(f"No hay CSV en {directory} para subir.")
        return 0

    for file in files:
        object_path = f"{OBJECT_PREFIX}/{file.name}"
        _request(
            method="POST",
            path=f"/storage/v1/object/{bucket}/{object_path}",
            data=file.read_bytes(),
            content_type="text/csv",
            extra_headers={"x-upsert": "true"},
            timeout=120,
        )
        print(f"Archivado {file.name}")

    print(f"Subidos {len(files)} CSV a Storage.")
    return len(files)


def main() -> None:
    if len(sys.argv) != 2 or sys.argv[1] not in {"ensure", "download", "upload"}:
        raise SystemExit(
            "Uso: python scripts/csv_archive.py "
            "[ensure|download|upload]"
        )

    command = sys.argv[1]
    if command == "ensure":
        ensure_bucket()
    elif command == "download":
        download_csvs()
    else:
        upload_csvs()


if __name__ == "__main__":
    main()
